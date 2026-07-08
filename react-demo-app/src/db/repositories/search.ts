import type { SqlDatabase } from "../client";
import { select } from "../query";
import { score, type SponseeCandidate, type SponsorCriteria } from "@/lib/matching";
import { formatCents, formatNumber } from "@/lib/format";
import { REGIONS, SPONSEE_TYPE_LABELS } from "@/lib/validation/onboarding";

const REGION_LABELS = new Map<string, string>(REGIONS.map(([value, label]) => [value, label]));
import type {
  AudienceInfo,
  Profile,
  Region,
  SponseeType,
  CompanySize,
} from "@/lib/types";

/** Rohzeilen — jsonb-Spalten kommen aus sql.js als TEXT zurück. */
type SponsorProfileRow = {
  id: string;
  profile_id: string;
  company_name: string;
  industry_id: string | null;
  company_size: CompanySize | null;
  budget_min: number | null;
  budget_max: number | null;
  target_audience: string;
  vat_id: string | null;
};

type SponseeProfileRow = {
  id: string;
  profile_id: string;
  type: SponseeType;
  category_id: string | null;
  reach_total: number | null;
  audience: string;
  social_links: string;
  media_kit_path: string | null;
  past_sponsors: string;
  price_min: number | null;
  price_max: number | null;
};

export type SearchFilters = {
  categoryId: string | null;
  region: Region | null;
  budgetMin: number | null;
  budgetMax: number | null;
  reachRequired: number | null;
};

export type SearchResultItem = {
  slug: string;
  name: string;
  category?: string;
  location?: string;
  avatarSrc?: string;
  verified: boolean;
  matchScore: number;
  priceFrom?: string;
  stats: { value: string; label: string }[];
  tags: string[];
};

function rangesOverlap(
  aLo: number | null,
  aHi: number | null,
  bLo: number | null,
  bHi: number | null
): boolean {
  return (aLo ?? 0) <= (bHi ?? Number.POSITIVE_INFINITY) && (bLo ?? 0) <= (aHi ?? Number.POSITIVE_INFINITY);
}

export function searchCategoryOptions(
  db: SqlDatabase,
  viewerIsSponsor: boolean
): { id: string; name: string; kind: string }[] {
  const kinds = viewerIsSponsor ? ["sport", "creator_niche"] : ["industry"];
  return select(
    db,
    `select id, name, kind from categories where kind in (${kinds.map(() => "?").join(",")}) order by name`,
    kinds
  );
}

/** Marktplatz-Suche + Matching v1 — Portierung von app/(app)/suche/page.tsx. */
export function searchCandidates(
  db: SqlDatabase,
  viewer: Profile,
  filters: SearchFilters
): SearchResultItem[] {
  const viewerIsSponsor = viewer.role === "sponsor";
  const categories = select<{ id: string; name: string }>(db, "select id, name from categories");
  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

  const results: SearchResultItem[] = [];

  if (viewerIsSponsor) {
    const ownSponsorRow = select<SponsorProfileRow>(
      db,
      "select * from sponsor_profiles where profile_id = ?",
      [viewer.id]
    )[0];
    const sponsorAudience: AudienceInfo = ownSponsorRow
      ? JSON.parse(ownSponsorRow.target_audience)
      : {};

    const rows = select<SponseeProfileRow>(db, "select * from sponsee_profiles limit 200");
    for (const row of rows) {
      const base = select<Profile>(
        db,
        "select * from profiles where id = ? and onboarding_completed = 1",
        [row.profile_id]
      )[0];
      if (!base || base.id === viewer.id) continue;

      if (filters.categoryId && row.category_id !== filters.categoryId) continue;
      if (filters.region && base.region !== filters.region) continue;
      if (filters.reachRequired != null && (row.reach_total ?? 0) < filters.reachRequired) continue;
      if (
        (filters.budgetMin != null || filters.budgetMax != null) &&
        !rangesOverlap(filters.budgetMin, filters.budgetMax, row.price_min, row.price_max)
      )
        continue;

      const audience: AudienceInfo = JSON.parse(row.audience);
      const pastSponsors: string[] = JSON.parse(row.past_sponsors);

      const criteria: SponsorCriteria = {
        categoryId: filters.categoryId,
        budgetMin: filters.budgetMin ?? ownSponsorRow?.budget_min ?? null,
        budgetMax: filters.budgetMax ?? ownSponsorRow?.budget_max ?? null,
        region: filters.region ?? viewer.region,
        reachRequired: filters.reachRequired,
        targetAudience: sponsorAudience,
      };
      const candidate: SponseeCandidate = {
        categoryId: row.category_id,
        priceMin: row.price_min,
        priceMax: row.price_max,
        region: base.region,
        reachTotal: row.reach_total,
        audience,
      };
      const match = score(criteria, candidate);

      const stats = [];
      if (row.reach_total != null) stats.push({ value: formatNumber(row.reach_total), label: "Reichweite" });
      if (pastSponsors.length > 0) stats.push({ value: String(pastSponsors.length), label: "Sponsoren" });

      results.push({
        slug: base.slug,
        name: base.display_name,
        category: row.category_id ? categoryNames.get(row.category_id) : SPONSEE_TYPE_LABELS[row.type],
        location: base.region ? REGION_LABELS.get(base.region) : undefined,
        avatarSrc: base.avatar_url ?? undefined,
        verified: !!base.is_verified,
        matchScore: match.total,
        priceFrom: row.price_min != null ? formatCents(row.price_min) : undefined,
        stats,
        tags: (audience.interests ?? []).slice(0, 4),
      });
    }
  } else {
    const ownSponseeRow = select<SponseeProfileRow>(
      db,
      "select * from sponsee_profiles where profile_id = ?",
      [viewer.id]
    )[0];
    const ownCandidate: SponseeCandidate = {
      categoryId: ownSponseeRow?.category_id ?? null,
      priceMin: ownSponseeRow?.price_min ?? null,
      priceMax: ownSponseeRow?.price_max ?? null,
      region: viewer.region,
      reachTotal: ownSponseeRow?.reach_total ?? null,
      audience: ownSponseeRow ? JSON.parse(ownSponseeRow.audience) : {},
    };

    const rows = select<SponsorProfileRow>(db, "select * from sponsor_profiles limit 200");
    for (const row of rows) {
      const base = select<Profile>(
        db,
        "select * from profiles where id = ? and onboarding_completed = 1",
        [row.profile_id]
      )[0];
      if (!base || base.id === viewer.id) continue;

      if (filters.categoryId && row.industry_id !== filters.categoryId) continue;
      if (filters.region && base.region !== filters.region) continue;
      if (
        (filters.budgetMin != null || filters.budgetMax != null) &&
        !rangesOverlap(filters.budgetMin, filters.budgetMax, row.budget_min, row.budget_max)
      )
        continue;

      const targetAudience: AudienceInfo = JSON.parse(row.target_audience);

      const criteria: SponsorCriteria = {
        categoryId: null,
        budgetMin: row.budget_min,
        budgetMax: row.budget_max,
        region: base.region,
        reachRequired: null,
        targetAudience,
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
        verified: !!base.is_verified,
        matchScore: match.total,
        priceFrom: row.budget_min != null ? formatCents(row.budget_min) : undefined,
        stats,
        tags: (targetAudience.interests ?? []).slice(0, 4),
      });
    }
  }

  results.sort((a, b) => b.matchScore - a.matchScore);
  return results;
}
