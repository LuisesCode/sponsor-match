"use client";

import { useRouter } from "next/navigation";

import { MatchCard, type MatchCardStat } from "@/components/ui/MatchCard";

export interface SearchResultItem {
  slug: string;
  name: string;
  category?: string;
  location?: string;
  avatarSrc?: string;
  verified: boolean;
  matchScore: number;
  priceFrom?: string;
  stats: MatchCardStat[];
  tags: string[];
}

/** Ergebnisraster der Suche — MatchCards mit Navigation zum Profil. */
export function SearchResults({ results }: { results: SearchResultItem[] }) {
  const router = useRouter();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "var(--space-5)",
      }}
    >
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
          onView={() => router.push(`/profil/${r.slug}`)}
        />
      ))}
    </div>
  );
}
