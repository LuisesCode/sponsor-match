import { describe, expect, it } from "vitest";

import {
  cancelDealSchema,
  counterDealSchema,
  parseMilestonesJson,
  proposeDealSchema,
  sumMilestoneAmounts,
} from "@/lib/validation/deal";

const uuid = "11111111-1111-4111-8111-111111111111";

const valid = {
  conversationId: uuid,
  title: "Ausrüstungspartnerschaft Saison 2026/27",
  description: "Logo auf Rennkleidung, monatlich zwei Instagram-Posts und Präsenz beim Saisonauftakt.",
  milestones: [
    { title: "Vertragsstart & Ankündigung", amount: "1.500", dueDate: "2026-08-01" },
    { title: "Zwischenbilanz", amount: "1.000,50", dueDate: "" },
  ],
};

describe("proposeDealSchema", () => {
  it("akzeptiert gültige Eingaben und konvertiert Euro → Cent", () => {
    const parsed = proposeDealSchema.parse(valid);
    expect(parsed.milestones[0].amount).toBe(150_000);
    expect(parsed.milestones[1].amount).toBe(100_050);
    expect(parsed.milestones[0].dueDate).toBe("2026-08-01");
    expect(parsed.milestones[1].dueDate).toBeNull();
    expect(sumMilestoneAmounts(parsed.milestones)).toBe(250_050);
  });

  it("lehnt fehlende oder zu viele Meilensteine ab", () => {
    expect(proposeDealSchema.safeParse({ ...valid, milestones: [] }).success).toBe(false);
    const tooMany = Array.from({ length: 21 }, (_, i) => ({
      title: `Meilenstein ${i + 1}`,
      amount: "100",
    }));
    expect(proposeDealSchema.safeParse({ ...valid, milestones: tooMany }).success).toBe(false);
  });

  it("lehnt Meilensteine ohne positiven Betrag ab", () => {
    expect(
      proposeDealSchema.safeParse({
        ...valid,
        milestones: [{ title: "Start", amount: "0" }],
      }).success
    ).toBe(false);
    expect(
      proposeDealSchema.safeParse({
        ...valid,
        milestones: [{ title: "Start", amount: "" }],
      }).success
    ).toBe(false);
  });

  it("lehnt zu kurzen Titel und zu kurze Beschreibung ab", () => {
    expect(proposeDealSchema.safeParse({ ...valid, title: "Kurz" }).success).toBe(false);
    expect(proposeDealSchema.safeParse({ ...valid, description: "Zu wenig." }).success).toBe(false);
  });
});

describe("counterDealSchema", () => {
  it("verlangt eine Deal-ID statt einer Konversation", () => {
    const { conversationId: _conversationId, ...rest } = valid;
    expect(counterDealSchema.safeParse({ ...rest, dealId: uuid }).success).toBe(true);
    expect(counterDealSchema.safeParse({ ...rest, dealId: "nope" }).success).toBe(false);
  });
});

describe("parseMilestonesJson", () => {
  it("parst gültiges JSON und fällt sonst auf [] zurück", () => {
    expect(parseMilestonesJson('[{"title":"A","amount":"100"}]')).toEqual([
      { title: "A", amount: "100" },
    ]);
    expect(parseMilestonesJson("kein json")).toEqual([]);
    expect(parseMilestonesJson(undefined)).toEqual([]);
  });
});

describe("cancelDealSchema", () => {
  it("verlangt eine Begründung mit mindestens 5 Zeichen", () => {
    expect(cancelDealSchema.safeParse({ dealId: uuid, reason: "Budget entfallen" }).success).toBe(true);
    expect(cancelDealSchema.safeParse({ dealId: uuid, reason: "x" }).success).toBe(false);
    expect(cancelDealSchema.safeParse({ dealId: uuid, reason: "" }).success).toBe(false);
  });
});
