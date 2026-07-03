import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select, type SelectOption } from "@/components/ui/Select";
import { formatCents, formatNumber } from "@/lib/format";
import { score, type SponseeCandidate, type SponsorCriteria } from "@/lib/matching";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import type {
  AudienceInfo,
  Profile,
  Region,
  SponseeProfile,
  SponsorProfile,
} from "@/lib/supabase/types";
import { euroToCents } from "@/lib/validation/onboarding";
import { REGIONS, SPONSEE_TYPE_LABELS } from "@/lib/validation/onboarding";

import { SearchResults, type SearchResultItem } from "./SearchResults";

export const metadata: Metadata = {
  title: "Suche — SponsorMatch",
};

const REGION_LABELS = new Map<string, string>(REGIONS.map(([value, label]) => [value, label]));
const REGION_OPTIONS: SelectOption[] = REGIONS.map(([value, label]) => ({ value, label }));

type SearchParams = {
  kategorie?: string;
  region?: string;
  budget_min?: string;
  budget_max?: string;
  reichweite?: string;
};

/** "10.000" → 10000; ungültig/leer → null. */
function parseIntParam(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw.replace(/[.\s]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

function parseEuroParam(raw: string | undefined): number | null {
  const cents = euroToCents(raw);
  return typeof cents === "number" ? cents : null;
}

/** Spannen [aLo,aHi] und [bLo,bHi] (null = offen) überlappen sich? */
function rangesOverlap(
  aLo: number | null,
  aHi: number | null,
  bLo: number | null,
  bHi: number | null
): boolean {
  return (aLo ?? 0) <= (bHi ?? Number.POSITIVE_INFINITY) && (bLo ?? 0) <= (aHi ?? Number.POSITIVE_INFINITY);
}

/**
 * Such- & Entdeckungsseite: Sponsoren sehen Gesponserte, Gesponserte
 * sehen Sponsoren — sortiert nach Match-Score (lib/matching).
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.onboarding_completed) redirect("/onboarding");

  const params = await searchParams;
  const filterCategory = params.kategorie || null;
  const filterRegion = (params.region || null) as Region | null;
  const filterBudgetMin = parseEuroParam(params.budget_min);
  const filterBudgetMax = parseEuroParam(params.budget_max);
  const filterReach = parseIntParam(params.reichweite);

  const supabase = await createClient();
  const viewerIsSponsor = profile.role === "sponsor";

  // Kategorien fürs Filter-Dropdown: Sponsoren filtern nach Sport/Nische,
  // Gesponserte nach Branche des Sponsors.
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, kind")
    .in("kind", viewerIsSponsor ? ["sport", "creator_niche"] : ["industry"])
    .order("name");
  const categoryNames = new Map((categories ?? []).map((c) => [c.id, c.name]));
  const categoryOptions: SelectOption[] = (categories ?? []).map((c) => ({
    value: c.id,
    label: c.kind === "creator_niche" ? `Creator: ${c.name}` : c.name,
  }));

  // Eigenes Rollenprofil (liefert die Matching-Kriterien bzw. den Kandidaten).
  const [{ data: ownSponsor }, { data: ownSponsee }] = await Promise.all([
    viewerIsSponsor
      ? supabase.from("sponsor_profiles").select("*").eq("profile_id", profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
    !viewerIsSponsor
      ? supabase.from("sponsee_profiles").select("*").eq("profile_id", profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // Gegenseite laden (v1: bis zu 200 Rollenprofile, Filter in der Anwendung).
  const roleTable = viewerIsSponsor ? "sponsee_profiles" : "sponsor_profiles";
  const { data: roleRows, error: loadError } = await supabase
    .from(roleTable)
    .select("*")
    .limit(200);

  const profileIds = (roleRows ?? []).map((r) => r.profile_id);
  let baseProfiles = new Map<string, Profile>();
  if (profileIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .in("id", profileIds)
      .eq("onboarding_completed", true)
      .is("deleted_at", null)
      .neq("id", profile.id);
    baseProfiles = new Map((data ?? []).map((p) => [p.id, p]));
  }

  const results: SearchResultItem[] = [];

  if (viewerIsSponsor) {
    const sponsorAudience: AudienceInfo = ownSponsor?.target_audience ?? {};
    for (const row of (roleRows ?? []) as SponseeProfile[]) {
      const base = baseProfiles.get(row.profile_id);
      if (!base) continue;
      // Filter
      if (filterCategory && row.category_id !== filterCategory) continue;
      if (filterRegion && base.region !== filterRegion) continue;
      if (filterReach != null && (row.reach_total ?? 0) < filterReach) continue;
      if (
        (filterBudgetMin != null || filterBudgetMax != null) &&
        !rangesOverlap(filterBudgetMin, filterBudgetMax, row.price_min, row.price_max)
      )
        continue;

      const criteria: SponsorCriteria = {
        categoryId: filterCategory,
        budgetMin: filterBudgetMin ?? ownSponsor?.budget_min ?? null,
        budgetMax: filterBudgetMax ?? ownSponsor?.budget_max ?? null,
        region: filterRegion ?? profile.region,
        reachRequired: filterReach,
        targetAudience: sponsorAudience,
      };
      const candidate: SponseeCandidate = {
        categoryId: row.category_id,
        priceMin: row.price_min,
        priceMax: row.price_max,
        region: base.region,
        reachTotal: row.reach_total,
        audience: row.audience ?? {},
      };
      const match = score(criteria, candidate);

      const stats = [];
      if (row.reach_total != null)
        stats.push({ value: formatNumber(row.reach_total), label: "Reichweite" });
      if (row.past_sponsors.length > 0)
        stats.push({ value: String(row.past_sponsors.length), label: "Sponsoren" });

      results.push({
        slug: base.slug,
        name: base.display_name,
        category: row.category_id ? categoryNames.get(row.category_id) : SPONSEE_TYPE_LABELS[row.type],
        location: base.region ? REGION_LABELS.get(base.region) : undefined,
        avatarSrc: base.avatar_url ?? undefined,
        verified: base.is_verified,
        matchScore: match.total,
        priceFrom: row.price_min != null ? formatCents(row.price_min) : undefined,
        stats,
        tags: (row.audience?.interests ?? []).slice(0, 4),
      });
    }
  } else {
    // Gesponserte:r sucht Sponsoren — Kriterien kommen vom jeweiligen Sponsor,
    // Kandidat ist das eigene Profil.
    const ownCandidate: SponseeCandidate = {
      categoryId: ownSponsee?.category_id ?? null,
      priceMin: ownSponsee?.price_min ?? null,
      priceMax: ownSponsee?.price_max ?? null,
      region: profile.region,
      reachTotal: ownSponsee?.reach_total ?? null,
      audience: ownSponsee?.audience ?? {},
    };
    for (const row of (roleRows ?? []) as SponsorProfile[]) {
      const base = baseProfiles.get(row.profile_id);
      if (!base) continue;
      // Filter
      if (filterCategory && row.industry_id !== filterCategory) continue;
      if (filterRegion && base.region !== filterRegion) continue;
      if (
        (filterBudgetMin != null || filterBudgetMax != null) &&
        !rangesOverlap(filterBudgetMin, filterBudgetMax, row.budget_min, row.budget_max)
      )
        continue;

      const criteria: SponsorCriteria = {
        categoryId: null, // Branche ≠ Sportart — neutral gewertet (Matching v1)
        budgetMin: row.budget_min,
        budgetMax: row.budget_max,
        region: base.region,
        reachRequired: null,
        targetAudience: row.target_audience ?? {},
      };
      const match = score(criteria, ownCandidate);

      const stats = [];
      if (row.company_size) stats.push({ value: row.company_size, label: "Mitarbeitende" });

      results.push({
        slug: base.slug,
        name: base.display_name,
        category: row.industry_id ? categoryNames.get(row.industry_id) : undefined,
        location: base.region ? REGION_LABELS.get(base.region) : undefined,
        avatarSrc: base.avatar_url ?? undefined,
        verified: base.is_verified,
        matchScore: match.total,
        priceFrom: row.budget_min != null ? formatCents(row.budget_min) : undefined,
        stats,
        tags: (row.target_audience?.interests ?? []).slice(0, 4),
      });
    }
  }

  results.sort((a, b) => b.matchScore - a.matchScore);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div>
        <span className="sm-eyebrow">Entdecken</span>
        <h1 style={{ fontSize: "var(--fs-h1)", margin: "var(--space-2) 0 0" }}>
          {viewerIsSponsor ? "Talente entdecken" : "Sponsoren entdecken"}
        </h1>
      </div>

      {/* Filter (GET-Formular — teilbare URLs, kein JS nötig) */}
      <Card padding="lg">
        <form
          method="get"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "var(--space-4)",
            alignItems: "end",
          }}
        >
          <Select
            name="kategorie"
            label={viewerIsSponsor ? "Kategorie" : "Branche"}
            options={categoryOptions}
            placeholder="Alle"
            defaultValue={filterCategory ?? ""}
          />
          <Select
            name="region"
            label="Region"
            options={REGION_OPTIONS}
            placeholder="Alle"
            defaultValue={filterRegion ?? ""}
          />
          <Input
            name="budget_min"
            label={viewerIsSponsor ? "Budget von (€)" : "Budget des Sponsors von (€)"}
            inputMode="decimal"
            placeholder="z.B. 500"
            defaultValue={params.budget_min ?? ""}
          />
          <Input
            name="budget_max"
            label="bis (€)"
            inputMode="decimal"
            placeholder="z.B. 5.000"
            defaultValue={params.budget_max ?? ""}
          />
          {viewerIsSponsor && (
            <Input
              name="reichweite"
              label="Mindest-Reichweite"
              inputMode="numeric"
              placeholder="z.B. 10.000"
              defaultValue={params.reichweite ?? ""}
            />
          )}
          <Button type="submit" variant="primary">
            Filtern
          </Button>
        </form>
      </Card>

      {/* Ergebnisse */}
      {loadError ? (
        <Card padding="lg">
          <p style={{ margin: 0, color: "var(--danger)" }}>
            Die Suche konnte gerade nicht geladen werden. Bitte versuch es gleich noch einmal.
          </p>
        </Card>
      ) : results.length === 0 ? (
        <Card padding="lg">
          <p style={{ margin: 0, color: "var(--text-muted)" }}>
            Noch keine Matches — verfeinere deine Filter oder erweitere die Region.
          </p>
        </Card>
      ) : (
        <>
          <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)", fontWeight: 600 }}>
            <span style={{ fontFamily: "var(--font-mono)" }}>{formatNumber(results.length)}</span>{" "}
            {results.length === 1 ? "Match" : "Matches"}, sortiert nach Match-Score
          </p>
          <SearchResults results={results} />
        </>
      )}
    </div>
  );
}
