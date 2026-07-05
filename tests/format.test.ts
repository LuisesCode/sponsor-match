import { describe, expect, it } from "vitest";

import {
  formatCents,
  formatCentsRange,
  formatDayLabel,
  formatMessageTimestamp,
  formatNumber,
  formatTime,
} from "@/lib/format";

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

describe("Nachrichten-Zeitstempel (M4)", () => {
  // Fixes "jetzt": Samstag, 04.07.2026 15:00 lokale Zeit.
  const now = new Date(2026, 6, 4, 15, 0);
  const today = new Date(2026, 6, 4, 14, 32).toISOString();
  const yesterday = new Date(2026, 6, 3, 9, 5).toISOString();
  const older = new Date(2026, 5, 28, 20, 15).toISOString();

  it("formatTime liefert Uhrzeit im 24h-Format", () => {
    expect(formatTime(today)).toBe("14:32");
  });

  it("formatMessageTimestamp: heute → Uhrzeit", () => {
    expect(formatMessageTimestamp(today, now)).toBe("14:32");
  });

  it("formatMessageTimestamp: gestern → „Gestern“", () => {
    expect(formatMessageTimestamp(yesterday, now)).toBe("Gestern");
  });

  it("formatMessageTimestamp: älter → deutsches Datum", () => {
    expect(formatMessageTimestamp(older, now)).toBe("28.06.2026");
  });

  it("formatDayLabel: heute/gestern/Datum", () => {
    expect(formatDayLabel(today, now)).toBe("Heute");
    expect(formatDayLabel(yesterday, now)).toBe("Gestern");
    expect(formatDayLabel(older, now)).toBe("28.06.2026");
  });
});
