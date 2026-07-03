import { describe, expect, it } from "vitest";

import {
  euroToCents,
  sponseeOnboardingSchema,
  sponsorOnboardingSchema,
} from "@/lib/validation/onboarding";

const validSponsor = {
  bio: "Wir sind ein Sportartikelhersteller aus München.",
  region: "bayern",
  website: "https://nordsport.example",
  ageGroups: ["18–24", "25–34"],
  interests: ["Fitness", "Outdoor"],
  companyName: "NordSport GmbH",
  industryId: "5f0cbe28-8f5a-4b83-9d3c-2a6d3e9b1c4a",
  companySize: "51-200",
  budgetMin: "500",
  budgetMax: "5.000",
  vatId: "DE123456789",
};

const validSponsee = {
  bio: "Fitness-Creatorin aus München.",
  region: "bayern",
  website: "",
  ageGroups: ["18–24"],
  interests: ["Fitness"],
  type: "creator",
  categoryId: "5f0cbe28-8f5a-4b83-9d3c-2a6d3e9b1c4a",
  reachTotal: "128.000",
  instagram: "https://instagram.com/lena",
  tiktok: "",
  youtube: "",
  pastSponsors: ["Adidas", "Rewe"],
  priceMin: "250",
  priceMax: "2.500",
};

describe("euroToCents", () => {
  it("konvertiert deutsche Beträge nach Cent", () => {
    expect(euroToCents("500")).toBe(50_000);
    expect(euroToCents("5.000")).toBe(500_000);
    expect(euroToCents("1200,50")).toBe(120_050);
  });

  it("liefert null für leere Eingaben", () => {
    expect(euroToCents("")).toBeNull();
    expect(euroToCents(null)).toBeNull();
  });

  it("liefert undefined (→ Schema-Fehler) für Unsinn und negative Werte", () => {
    expect(euroToCents("abc")).toBeUndefined();
    expect(euroToCents("-5")).toBeUndefined();
  });
});

describe("sponsorOnboardingSchema", () => {
  it("akzeptiert vollständige, gültige Angaben", () => {
    const parsed = sponsorOnboardingSchema.parse(validSponsor);
    expect(parsed.budgetMin).toBe(50_000);
    expect(parsed.budgetMax).toBe(500_000);
    expect(parsed.website).toBe("https://nordsport.example");
  });

  it("verlangt Firmenname und Branche", () => {
    const result = sponsorOnboardingSchema.safeParse({
      ...validSponsor,
      companyName: "",
      industryId: "keine-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("weist budgetMin > budgetMax zurück", () => {
    const result = sponsorOnboardingSchema.safeParse({
      ...validSponsor,
      budgetMin: "5.000",
      budgetMax: "500",
    });
    expect(result.success).toBe(false);
  });

  it("macht leere optionale Felder zu null", () => {
    const parsed = sponsorOnboardingSchema.parse({
      ...validSponsor,
      bio: "",
      website: "",
      vatId: "",
      budgetMin: "",
      budgetMax: "",
      companySize: null,
    });
    expect(parsed.bio).toBeNull();
    expect(parsed.website).toBeNull();
    expect(parsed.vatId).toBeNull();
    expect(parsed.budgetMin).toBeNull();
  });
});

describe("sponseeOnboardingSchema", () => {
  it("akzeptiert vollständige, gültige Angaben", () => {
    const parsed = sponseeOnboardingSchema.parse(validSponsee);
    expect(parsed.reachTotal).toBe(128_000);
    expect(parsed.priceMin).toBe(25_000);
    expect(parsed.tiktok).toBeNull();
  });

  it("verlangt Typ und Kategorie", () => {
    const result = sponseeOnboardingSchema.safeParse({
      ...validSponsee,
      type: "influencer",
      categoryId: "",
    });
    expect(result.success).toBe(false);
  });

  it("weist ungültige Social-URLs zurück", () => {
    const result = sponseeOnboardingSchema.safeParse({
      ...validSponsee,
      instagram: "kein-link",
    });
    expect(result.success).toBe(false);
  });

  it("weist priceMin > priceMax zurück", () => {
    const result = sponseeOnboardingSchema.safeParse({
      ...validSponsee,
      priceMin: "2.500",
      priceMax: "250",
    });
    expect(result.success).toBe(false);
  });
});
