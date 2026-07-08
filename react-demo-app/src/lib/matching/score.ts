import type { Region } from "@/lib/types";

import type {
  MatchBreakdownEntry,
  MatchCriterion,
  MatchResult,
  MatchScorer,
  SponseeCandidate,
  SponsorCriteria,
} from "./types";

/**
 * Regelbasiertes Scoring (Matching v1). Jedes Kriterium liefert einen
 * normierten Score 0–1; fehlende Angaben werden neutral (0,5) gewertet,
 * damit unvollständige Profile weder bevorzugt noch abgestraft werden.
 */

/** Gewichte der Kriterien — Summe 100. */
export const MATCH_WEIGHTS: Record<MatchCriterion, number> = {
  category: 30,
  budget: 25,
  region: 15,
  reach: 15,
  audience: 15,
};

/** Neutraler Score, wenn eine Seite keine Angabe gemacht hat. */
const NEUTRAL = 0.5;

/** Kategorie: gleiche Kategorie hoch, sonst neutral (Affinität einfach gehalten). */
export function scoreCategory(a: string | null, b: string | null): number {
  if (!a || !b) return NEUTRAL;
  return a === b ? 1 : NEUTRAL;
}

/**
 * Budget-/Preis-Überlappung. Offene Enden (null) gelten als unbegrenzt.
 * Überlappen sich die Spannen → 1; sonst fällt der Score mit der relativen
 * Lücke zwischen den Spannen (bei doppeltem Abstand → 0).
 */
export function scoreBudget(
  budgetMin: number | null,
  budgetMax: number | null,
  priceMin: number | null,
  priceMax: number | null
): number {
  const noBudget = budgetMin == null && budgetMax == null;
  const noPrice = priceMin == null && priceMax == null;
  if (noBudget || noPrice) return NEUTRAL;

  const bLo = budgetMin ?? 0;
  const bHi = budgetMax ?? Number.POSITIVE_INFINITY;
  const pLo = priceMin ?? 0;
  const pHi = priceMax ?? Number.POSITIVE_INFINITY;

  if (bLo <= pHi && pLo <= bHi) return 1;

  // Keine Überlappung: relative Lücke bestimmen.
  const gap = pLo > bHi ? pLo - bHi : bLo - pHi;
  const reference = pLo > bHi ? bHi : pHi;
  if (!Number.isFinite(reference) || reference <= 0) return 0;
  return Math.max(0, 1 - gap / reference);
}

/** Länderzuordnung der Region-Enums (DACH). */
function country(region: Region): "de" | "at" | "ch" {
  if (region === "at") return "at";
  if (region === "ch") return "ch";
  return "de";
}

/**
 * Region: exakt gleich → 1; gleiches Land (anderes Bundesland) → 0,7;
 * Nachbarland (DE/AT/CH sind paarweise Nachbarn) → 0,4; unbekannt → neutral.
 */
export function scoreRegion(a: Region | null, b: Region | null): number {
  if (!a || !b) return NEUTRAL;
  if (a === b) return 1;
  if (country(a) === country(b)) return 0.7;
  return 0.4;
}

/**
 * Reichweite vs. Anforderung: erfüllt → 1, sonst anteilig (reach/required).
 * Keine Anforderung → neutral; Anforderung ohne bekannte Reichweite → 0,3.
 */
export function scoreReach(reachTotal: number | null, reachRequired: number | null): number {
  if (reachRequired == null || reachRequired <= 0) return NEUTRAL;
  if (reachTotal == null) return 0.3;
  if (reachTotal >= reachRequired) return 1;
  return reachTotal / reachRequired;
}

/** Jaccard-Ähnlichkeit zweier Mengen (leer/leer → null = keine Aussage). */
function jaccard(a: string[] | undefined, b: string[] | undefined): number | null {
  const setA = new Set((a ?? []).map((s) => s.trim().toLowerCase()).filter(Boolean));
  const setB = new Set((b ?? []).map((s) => s.trim().toLowerCase()).filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return null;
  let intersection = 0;
  for (const item of setA) if (setB.has(item)) intersection += 1;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? null : intersection / union;
}

/**
 * Zielgruppen-Überschneidung: Mittel aus Jaccard(age_groups) und
 * Jaccard(interests) — nur über die Dimensionen, zu denen beide Seiten
 * Angaben gemacht haben; sonst neutral.
 */
export function scoreAudience(
  target: SponsorCriteria["targetAudience"],
  audience: SponseeCandidate["audience"]
): number {
  const parts = [
    jaccard(target.age_groups, audience.age_groups),
    jaccard(target.interests, audience.interests),
  ].filter((v): v is number => v != null);
  if (parts.length === 0) return NEUTRAL;
  return parts.reduce((sum, v) => sum + v, 0) / parts.length;
}

function entry(criterion: MatchCriterion, score: number): MatchBreakdownEntry {
  const clamped = Math.min(1, Math.max(0, score));
  const weight = MATCH_WEIGHTS[criterion];
  return { score: clamped, weight, points: clamped * weight };
}

/** Regelbasierter Scorer (Matching v1) — 0–100 mit Kriterien-Breakdown. */
export const score: MatchScorer = (criteria, candidate): MatchResult => {
  const breakdown: Record<MatchCriterion, MatchBreakdownEntry> = {
    category: entry("category", scoreCategory(criteria.categoryId, candidate.categoryId)),
    budget: entry(
      "budget",
      scoreBudget(criteria.budgetMin, criteria.budgetMax, candidate.priceMin, candidate.priceMax)
    ),
    region: entry("region", scoreRegion(criteria.region, candidate.region)),
    reach: entry("reach", scoreReach(candidate.reachTotal, criteria.reachRequired)),
    audience: entry("audience", scoreAudience(criteria.targetAudience, candidate.audience)),
  };

  const total = Math.round(
    Object.values(breakdown).reduce((sum, e) => sum + e.points, 0)
  );

  return { total, breakdown };
};
