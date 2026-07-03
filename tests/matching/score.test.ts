import { describe, expect, it } from "vitest";

import {
  MATCH_WEIGHTS,
  score,
  scoreAudience,
  scoreBudget,
  scoreCategory,
  scoreReach,
  scoreRegion,
} from "@/lib/matching";
import type { SponseeCandidate, SponsorCriteria } from "@/lib/matching";

const CAT_A = "11111111-1111-1111-1111-111111111111";
const CAT_B = "22222222-2222-2222-2222-222222222222";

function criteria(overrides: Partial<SponsorCriteria> = {}): SponsorCriteria {
  return {
    categoryId: null,
    budgetMin: null,
    budgetMax: null,
    region: null,
    reachRequired: null,
    targetAudience: {},
    ...overrides,
  };
}

function candidate(overrides: Partial<SponseeCandidate> = {}): SponseeCandidate {
  return {
    categoryId: null,
    priceMin: null,
    priceMax: null,
    region: null,
    reachTotal: null,
    audience: {},
    ...overrides,
  };
}

describe("MATCH_WEIGHTS", () => {
  it("summieren sich zu 100", () => {
    const sum = Object.values(MATCH_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });
});

describe("scoreCategory", () => {
  it("gleiche Kategorie → 1", () => {
    expect(scoreCategory(CAT_A, CAT_A)).toBe(1);
  });

  it("unterschiedliche Kategorie → neutral 0,5", () => {
    expect(scoreCategory(CAT_A, CAT_B)).toBe(0.5);
  });

  it("fehlende Angabe → neutral 0,5", () => {
    expect(scoreCategory(null, CAT_A)).toBe(0.5);
    expect(scoreCategory(CAT_A, null)).toBe(0.5);
    expect(scoreCategory(null, null)).toBe(0.5);
  });
});

describe("scoreBudget", () => {
  it("überlappende Spannen → 1", () => {
    expect(scoreBudget(50_000, 500_000, 100_000, 300_000)).toBe(1);
  });

  it("Berührung am Rand zählt als Überlappung", () => {
    expect(scoreBudget(50_000, 100_000, 100_000, 200_000)).toBe(1);
  });

  it("offenes Budget-Ende überlappt mit allem darüber", () => {
    expect(scoreBudget(50_000, null, 900_000, 1_000_000)).toBe(1);
  });

  it("keine Angabe auf einer Seite → neutral 0,5", () => {
    expect(scoreBudget(null, null, 100_000, 200_000)).toBe(0.5);
    expect(scoreBudget(100_000, 200_000, null, null)).toBe(0.5);
  });

  it("kleine Lücke → anteiliger Score, große Lücke → 0", () => {
    // Budget bis €1.000, Preis ab €1.500 → Lücke 50 % der Referenz → 0,5
    expect(scoreBudget(0, 100_000, 150_000, 200_000)).toBeCloseTo(0.5);
    // Preis ab dem Dreifachen des Budgets → 0
    expect(scoreBudget(0, 100_000, 300_000, 400_000)).toBe(0);
  });

  it("Preis unter dem Budget-Minimum wird ebenfalls anteilig gewertet", () => {
    // Budget ab €1.000, Preis bis €500 → Lücke relativ zum Preis-Maximum
    expect(scoreBudget(100_000, 200_000, 10_000, 50_000)).toBe(0);
    expect(scoreBudget(60_000, 200_000, 10_000, 50_000)).toBeCloseTo(0.8);
  });
});

describe("scoreRegion", () => {
  it("exakt gleiche Region → 1", () => {
    expect(scoreRegion("bayern", "bayern")).toBe(1);
  });

  it("gleiches Land, anderes Bundesland → 0,7", () => {
    expect(scoreRegion("bayern", "hamburg")).toBe(0.7);
  });

  it("Nachbarland (DACH) → 0,4", () => {
    expect(scoreRegion("bayern", "at")).toBe(0.4);
    expect(scoreRegion("at", "ch")).toBe(0.4);
  });

  it("fehlende Angabe → neutral 0,5", () => {
    expect(scoreRegion(null, "bayern")).toBe(0.5);
    expect(scoreRegion("at", null)).toBe(0.5);
  });
});

describe("scoreReach", () => {
  it("Anforderung erfüllt → 1", () => {
    expect(scoreReach(100_000, 50_000)).toBe(1);
    expect(scoreReach(50_000, 50_000)).toBe(1);
  });

  it("teilweise erfüllt → anteilig", () => {
    expect(scoreReach(25_000, 50_000)).toBeCloseTo(0.5);
  });

  it("keine Anforderung → neutral 0,5", () => {
    expect(scoreReach(100_000, null)).toBe(0.5);
    expect(scoreReach(null, null)).toBe(0.5);
  });

  it("Anforderung ohne bekannte Reichweite → 0,3", () => {
    expect(scoreReach(null, 50_000)).toBe(0.3);
  });
});

describe("scoreAudience", () => {
  it("identische Zielgruppen → 1", () => {
    expect(
      scoreAudience(
        { age_groups: ["18–24", "25–34"], interests: ["Fitness"] },
        { age_groups: ["18–24", "25–34"], interests: ["Fitness"] }
      )
    ).toBe(1);
  });

  it("teilweise Überschneidung → Jaccard-Mittel", () => {
    // age_groups: 1 von 3 gemeinsam → 1/3; interests fehlen bei einer Seite → ignoriert
    expect(
      scoreAudience(
        { age_groups: ["18–24", "25–34"], interests: [] },
        { age_groups: ["25–34", "35–44"] }
      )
    ).toBeCloseTo(1 / 3);
  });

  it("Groß-/Kleinschreibung und Leerzeichen egal", () => {
    expect(
      scoreAudience({ interests: ["fitness "] }, { interests: ["Fitness"] })
    ).toBe(1);
  });

  it("keine Überschneidung → 0", () => {
    expect(
      scoreAudience({ interests: ["Gaming"] }, { interests: ["Kochen"] })
    ).toBe(0);
  });

  it("keine Angaben → neutral 0,5", () => {
    expect(scoreAudience({}, {})).toBe(0.5);
    expect(scoreAudience({ age_groups: [] }, { interests: [] })).toBe(0.5);
  });
});

describe("score (Gesamtscore)", () => {
  it("perfekter Match → 100", () => {
    const result = score(
      criteria({
        categoryId: CAT_A,
        budgetMin: 100_000,
        budgetMax: 500_000,
        region: "bayern",
        reachRequired: 50_000,
        targetAudience: { age_groups: ["18–24"], interests: ["Fitness"] },
      }),
      candidate({
        categoryId: CAT_A,
        priceMin: 200_000,
        priceMax: 400_000,
        region: "bayern",
        reachTotal: 120_000,
        audience: { age_groups: ["18–24"], interests: ["Fitness"] },
      })
    );
    expect(result.total).toBe(100);
    expect(result.breakdown.category.points).toBe(MATCH_WEIGHTS.category);
  });

  it("komplett leere Angaben → neutraler Mittelwert", () => {
    const result = score(criteria(), candidate());
    // Alle Kriterien neutral (0,5) → 50 Punkte
    expect(result.total).toBe(50);
  });

  it("liegt immer zwischen 0 und 100 (ganzzahlig)", () => {
    const result = score(
      criteria({
        categoryId: CAT_A,
        budgetMin: 0,
        budgetMax: 10_000,
        region: "bayern",
        reachRequired: 1_000_000,
        targetAudience: { interests: ["Gaming"] },
      }),
      candidate({
        categoryId: CAT_B,
        priceMin: 500_000,
        priceMax: 900_000,
        region: "ch",
        reachTotal: 1_000,
        audience: { interests: ["Kochen"] },
      })
    );
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(Number.isInteger(result.total)).toBe(true);
  });

  it("breakdown-Punkte summieren sich (gerundet) zum total", () => {
    const result = score(
      criteria({ categoryId: CAT_A, region: "hamburg" }),
      candidate({ categoryId: CAT_A, region: "bremen" })
    );
    const sum = Object.values(result.breakdown).reduce((a, e) => a + e.points, 0);
    expect(result.total).toBe(Math.round(sum));
  });

  it("besserer Kandidat bekommt höheren Score (Ranking-Eigenschaft)", () => {
    const c = criteria({
      categoryId: CAT_A,
      budgetMin: 100_000,
      budgetMax: 300_000,
      region: "bayern",
      reachRequired: 50_000,
    });
    const strong = score(
      c,
      candidate({ categoryId: CAT_A, priceMin: 150_000, priceMax: 250_000, region: "bayern", reachTotal: 80_000 })
    );
    const weak = score(
      c,
      candidate({ categoryId: CAT_B, priceMin: 400_000, priceMax: 600_000, region: "ch", reachTotal: 10_000 })
    );
    expect(strong.total).toBeGreaterThan(weak.total);
  });
});
