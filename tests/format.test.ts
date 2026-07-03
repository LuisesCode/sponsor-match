import { describe, expect, it } from "vitest";

import { formatCents, formatCentsRange, formatNumber } from "@/lib/format";

describe("formatNumber", () => {
  it("nutzt deutschen Tausenderpunkt", () => {
    expect(formatNumber(128000)).toBe("128.000");
    expect(formatNumber(950)).toBe("950");
  });
});

describe("formatCents", () => {
  it("formatiert glatte Beträge ohne Nachkommastellen", () => {
    expect(formatCents(120_000)).toBe("€1.200");
  });

  it("formatiert krumme Beträge mit Dezimalkomma", () => {
    expect(formatCents(120_050)).toBe("€1.200,50");
  });
});

describe("formatCentsRange", () => {
  it("formatiert vollständige Spannen", () => {
    expect(formatCentsRange(50_000, 500_000)).toBe("€500 – €5.000");
  });

  it("formatiert offene Spannen", () => {
    expect(formatCentsRange(50_000, null)).toBe("ab €500");
    expect(formatCentsRange(null, 500_000)).toBe("bis €5.000");
  });

  it("liefert null ohne Angaben", () => {
    expect(formatCentsRange(null, null)).toBeNull();
  });
});
