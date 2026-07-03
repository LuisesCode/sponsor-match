import { describe, expect, it } from "vitest";

import { listingSchema, listingStatusSchema } from "@/lib/validation/listing";

const valid = {
  title: "Triathletin sucht Ausrüstungspartner",
  description: "Ich starte 2027 bei fünf Mitteldistanzen und biete Logo-Präsenz auf Rennkleidung und Social Media.",
  categoryId: "11111111-1111-4111-8111-111111111111",
  region: "bayern",
  budgetMin: "500",
  budgetMax: "2.500",
  reachRequired: "10.000",
  expiresAt: "2099-12-31",
  status: "active",
};

describe("listingSchema", () => {
  it("akzeptiert gültige Eingaben und konvertiert Euro → Cent", () => {
    const parsed = listingSchema.parse(valid);
    expect(parsed.budgetMin).toBe(50_000);
    expect(parsed.budgetMax).toBe(250_000);
    expect(parsed.reachRequired).toBe(10_000);
    expect(parsed.status).toBe("active");
  });

  it("leere optionale Felder werden zu null", () => {
    const parsed = listingSchema.parse({
      ...valid,
      categoryId: "",
      region: "",
      budgetMin: "",
      budgetMax: "",
      reachRequired: "",
      expiresAt: "",
    });
    expect(parsed.categoryId).toBeNull();
    expect(parsed.region).toBeNull();
    expect(parsed.budgetMin).toBeNull();
    expect(parsed.expiresAt).toBeNull();
  });

  it("lehnt zu kurzen Titel und zu kurze Beschreibung ab", () => {
    expect(listingSchema.safeParse({ ...valid, title: "Kurz" }).success).toBe(false);
    expect(listingSchema.safeParse({ ...valid, description: "Zu wenig." }).success).toBe(false);
  });

  it("lehnt Budget-Maximum unter dem Minimum ab", () => {
    const result = listingSchema.safeParse({ ...valid, budgetMin: "1000", budgetMax: "500" });
    expect(result.success).toBe(false);
  });

  it("lehnt Ablaufdatum in der Vergangenheit ab", () => {
    const result = listingSchema.safeParse({ ...valid, expiresAt: "2020-01-01" });
    expect(result.success).toBe(false);
  });

  it("lehnt ungültige Region und ungültigen Status ab", () => {
    expect(listingSchema.safeParse({ ...valid, region: "mars" }).success).toBe(false);
    expect(listingSchema.safeParse({ ...valid, status: "paused" }).success).toBe(false);
  });
});

describe("listingStatusSchema", () => {
  it("akzeptiert nur die erlaubten Statuswechsel", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(listingStatusSchema.safeParse({ listingId: id, status: "paused" }).success).toBe(true);
    expect(listingStatusSchema.safeParse({ listingId: id, status: "draft" }).success).toBe(false);
    expect(listingStatusSchema.safeParse({ listingId: "nope", status: "active" }).success).toBe(false);
  });
});
