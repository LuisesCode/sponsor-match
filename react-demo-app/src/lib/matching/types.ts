import type { AudienceInfo, Region } from "@/lib/types";

/**
 * Flenzko — Matching v1 (regelbasiert).
 * Das Interface ist bewusst so geschnitten, dass später ein ML-Scorer
 * dieselbe Signatur bedienen kann: score(criteria, candidate) → 0–100.
 */

/** Was die Sponsor-Seite sucht (aus sponsor_profiles bzw. einem Listing). */
export type SponsorCriteria = {
  /** Gewünschte Kategorie (Sportart/Creator-Nische) — null = keine Präferenz. */
  categoryId: string | null;
  budgetMin: number | null; // Cent
  budgetMax: number | null; // Cent
  region: Region | null;
  /** Mindest-Reichweite — null = keine Anforderung. */
  reachRequired: number | null;
  targetAudience: AudienceInfo;
};

/** Was die gesponserte Seite anbietet (aus sponsee_profiles bzw. einem Listing). */
export type SponseeCandidate = {
  categoryId: string | null;
  priceMin: number | null; // Cent
  priceMax: number | null; // Cent
  region: Region | null;
  reachTotal: number | null;
  audience: AudienceInfo;
};

export type MatchCriterion = "category" | "budget" | "region" | "reach" | "audience";

/** Teilergebnis eines Kriteriums: normierter Score (0–1) und gewichtete Punkte. */
export type MatchBreakdownEntry = {
  /** Normierter Erfüllungsgrad 0–1 (0,5 = neutral/unbekannt). */
  score: number;
  /** Gewicht des Kriteriums (Summe aller Gewichte = 100). */
  weight: number;
  /** score × weight — Beitrag zum Gesamtscore. */
  points: number;
};

export type MatchResult = {
  /** Gesamtscore 0–100 (ganzzahlig). */
  total: number;
  breakdown: Record<MatchCriterion, MatchBreakdownEntry>;
};

/** Austauschbare Scorer-Signatur (regelbasiert heute, ML später). */
export type MatchScorer = (criteria: SponsorCriteria, candidate: SponseeCandidate) => MatchResult;
