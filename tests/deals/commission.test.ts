import { describe, expect, it } from "vitest";

import { calcCommissionAmount, calcPayoutAmount } from "@/lib/deals/commission";

describe("calcCommissionAmount", () => {
  it("berechnet 10 % Provision in Cent", () => {
    expect(calcCommissionAmount(500_000, 10)).toBe(50_000); // €5.000 → €500
  });

  it("rundet kaufmännisch wie das SQL-round() (half away from zero)", () => {
    expect(calcCommissionAmount(5, 10)).toBe(1); // 0,5 Cent → 1 Cent
    expect(calcCommissionAmount(25, 10)).toBe(3); // 2,5 Cent → 3 Cent
    expect(calcCommissionAmount(999, 12.5)).toBe(125); // 124,875 → 125
  });

  it("vermeidet Fließkomma-Artefakte bei krummen Sätzen", () => {
    // 8,25 % von €333,33: 33333 * 825 / 10000 = 2749,9725 → 2750
    expect(calcCommissionAmount(33_333, 8.25)).toBe(2_750);
  });

  it("behandelt Randsätze 0 % und 100 %", () => {
    expect(calcCommissionAmount(123_456, 0)).toBe(0);
    expect(calcCommissionAmount(123_456, 100)).toBe(123_456);
  });

  it("lehnt ungültige Eingaben ab", () => {
    expect(() => calcCommissionAmount(100.5, 10)).toThrow(RangeError);
    expect(() => calcCommissionAmount(-1, 10)).toThrow(RangeError);
    expect(() => calcCommissionAmount(100, -1)).toThrow(RangeError);
    expect(() => calcCommissionAmount(100, 101)).toThrow(RangeError);
  });
});

describe("calcPayoutAmount", () => {
  it("Auszahlung = Gesamtbetrag − Provision (Abzug vom Gesponserten)", () => {
    expect(calcPayoutAmount(500_000, 10)).toBe(450_000);
    expect(calcPayoutAmount(999, 12.5)).toBe(874);
  });

  it("Provision + Auszahlung ergeben immer den Gesamtbetrag", () => {
    for (const [amount, pct] of [
      [123_457, 7.77],
      [1, 50],
      [99_999_99, 12.34],
    ] as const) {
      expect(calcCommissionAmount(amount, pct) + calcPayoutAmount(amount, pct)).toBe(amount);
    }
  });
});
