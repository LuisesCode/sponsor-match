import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { MatchCard } from "@/components/ui/MatchCard";
import { Select, type SelectOption } from "@/components/ui/Select";
import { useSession } from "@/auth/SessionContext";
import { getDb } from "@/db/client";
import { searchCandidates, searchCategoryOptions, type SearchResultItem } from "@/db/repositories/search";
import { formatNumber } from "@/lib/format";
import { euroToCents, REGIONS } from "@/lib/validation/onboarding";
import type { Region } from "@/lib/types";

const REGION_OPTIONS: SelectOption[] = REGIONS.map(([value, label]) => ({ value, label }));

function parseIntField(raw: string): number | null {
  if (!raw) return null;
  const n = Number(raw.replace(/[.\s]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

function parseEuroField(raw: string): number | null {
  const cents = euroToCents(raw);
  return typeof cents === "number" ? cents : null;
}

/** Such- & Entdeckungsseite — Struktur 1:1 aus app/(app)/suche/page.tsx. */
export default function Suche() {
  const { profile } = useSession();
  const navigate = useNavigate();
  const [categoryOptions, setCategoryOptions] = React.useState<SelectOption[]>([]);
  const [results, setResults] = React.useState<SearchResultItem[] | null>(null);

  const [kategorie, setKategorie] = React.useState("");
  const [region, setRegion] = React.useState("");
  const [budgetMin, setBudgetMin] = React.useState("");
  const [budgetMax, setBudgetMax] = React.useState("");
  const [reichweite, setReichweite] = React.useState("");

  const viewerIsSponsor = profile?.role === "sponsor";

  const runSearch = React.useCallback(async () => {
    if (!profile) return;
    const db = await getDb();
    const cats = searchCategoryOptions(db, profile.role === "sponsor");
    setCategoryOptions(
      cats.map((c) => ({ value: c.id, label: c.kind === "creator_niche" ? `Creator: ${c.name}` : c.name }))
    );
    const items = searchCandidates(db, profile, {
      categoryId: kategorie || null,
      region: (region || null) as Region | null,
      budgetMin: parseEuroField(budgetMin),
      budgetMax: parseEuroField(budgetMax),
      reachRequired: parseIntField(reichweite),
    });
    setResults(items);
  }, [profile, kategorie, region, budgetMin, budgetMax, reichweite]);

  React.useEffect(() => {
    void runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  if (!profile) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div>
        <span className="fk-eyebrow">Entdecken</span>
        <h1 style={{ fontSize: "var(--fs-h1)", margin: "var(--space-2) 0 0" }}>
          {viewerIsSponsor ? "Talente entdecken" : "Sponsoren entdecken"}
        </h1>
      </div>

      <Card padding="lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runSearch();
          }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-4)", alignItems: "end" }}
        >
          <Select
            label={viewerIsSponsor ? "Kategorie" : "Branche"}
            options={categoryOptions}
            placeholder="Alle"
            value={kategorie}
            onChange={(e) => setKategorie(e.target.value)}
          />
          <Select label="Region" options={REGION_OPTIONS} placeholder="Alle" value={region} onChange={(e) => setRegion(e.target.value)} />
          <Input
            label={viewerIsSponsor ? "Budget von (€)" : "Budget des Sponsors von (€)"}
            inputMode="decimal"
            placeholder="z.B. 500"
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
          />
          <Input label="bis (€)" inputMode="decimal" placeholder="z.B. 5.000" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
          {viewerIsSponsor && (
            <Input
              label="Mindest-Reichweite"
              inputMode="numeric"
              placeholder="z.B. 10.000"
              value={reichweite}
              onChange={(e) => setReichweite(e.target.value)}
            />
          )}
          <Button type="submit" variant="primary">
            Filtern
          </Button>
        </form>
      </Card>

      {results == null ? null : results.length === 0 ? (
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--space-5)" }}>
            {results.map((r) => (
              <MatchCard
                key={r.slug}
                name={r.name}
                category={r.category}
                location={r.location}
                avatarSrc={r.avatarSrc}
                verified={r.verified}
                matchScore={r.matchScore}
                priceFrom={r.priceFrom}
                stats={r.stats}
                tags={r.tags}
                onView={() => navigate(`/profil/${r.slug}`)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
