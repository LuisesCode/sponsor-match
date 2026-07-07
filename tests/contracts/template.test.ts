import { describe, expect, it } from "vitest";

import { renderContractSections } from "@/lib/contracts/template";
import type { ContractContent } from "@/lib/supabase/types";

const content: ContractContent = {
  template_version: "v1",
  created_at: "2026-07-05T10:00:00Z",
  deal: {
    id: "d1",
    title: "Ausrüstungspartnerschaft 2026/27",
    description: "Logo auf Rennkleidung und zwei Posts pro Monat.",
    amount_total: 250_000,
    currency: "eur",
    commission_pct: 10,
    commission_amount: 25_000,
    payout_amount: 225_000,
    listing_id: null,
  },
  sponsor: {
    profile_id: "p1",
    display_name: "NordSport Test GmbH",
    company_name: "NordSport GmbH",
  },
  sponsee: { profile_id: "p2", display_name: "Lena Testfuchs" },
  milestones: [
    { position: 1, title: "Kickoff", amount: 150_000, due_date: "2026-08-01" },
    { position: 2, title: "Abschluss", amount: 100_000, due_date: null },
  ],
};

describe("renderContractSections (Vorlage v1)", () => {
  const sections = renderContractSections(content);
  const text = sections.flatMap((s) => [s.heading, ...s.paragraphs]).join("\n");

  it("nennt beide Parteien", () => {
    expect(text).toContain("NordSport GmbH");
    expect(text).toContain("Lena Testfuchs");
  });

  it("weist Vergütung, Provision und Auszahlung im deutschen Format aus", () => {
    expect(text).toContain("€2.500");
    expect(text).toContain("10 %");
    expect(text).toContain("€250");
    expect(text).toContain("€2.250");
  });

  it("listet Meilensteine mit Fälligkeit", () => {
    expect(text).toContain("1. Kickoff — €1.500, fällig zum 01.08.2026");
    expect(text).toContain("2. Abschluss — €1.000");
  });

  it("beschreibt beidseitige Zustimmung und Zustimmungs-Reset bei Gegenangebot", () => {
    expect(text).toContain("beide Parteien");
    expect(text).toContain("Gegenangebot");
  });

  it("kommunziert Dezimal-Provisionssätze mit Komma", () => {
    const withDecimalPct = renderContractSections({
      ...content,
      deal: { ...content.deal, commission_pct: 12.5 },
    });
    const pctText = withDecimalPct.flatMap((s) => s.paragraphs).join("\n");
    expect(pctText).toContain("12,5 %");
  });
});
