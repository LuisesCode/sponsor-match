/**
 * Flenzko — Provisionsrechnung (M5, vgl. PLAN.md §6 Entscheidung 1).
 * Provisionsmodell: Abzug vom Gesponserten — der Sponsor zahlt amount_total,
 * die Plattform behält commission_amount, der Rest geht an den Gesponserten.
 *
 * Spiegelt exakt public.calc_commission_amount() aus der M5-Migration:
 * round(amount_total * pct / 100), kaufmännisch (half away from zero).
 * Der Satz (commission_pct) wird beim Deal-Anlegen aus platform_settings
 * eingefroren — spätere Satzänderungen betreffen laufende Deals nicht.
 */

/** Provision in Cent aus Gesamtbetrag (Cent) und Prozentsatz (z. B. 10 oder 12,5). */
export function calcCommissionAmount(amountTotalCents: number, commissionPct: number): number {
  if (!Number.isInteger(amountTotalCents) || amountTotalCents < 0) {
    throw new RangeError("amountTotalCents muss eine nicht-negative ganze Zahl (Cent) sein.");
  }
  if (!Number.isFinite(commissionPct) || commissionPct < 0 || commissionPct > 100) {
    throw new RangeError("commissionPct muss zwischen 0 und 100 liegen.");
  }
  // In Basispunkten rechnen, um Fließkomma-Artefakte (z. B. 12,5 %) zu vermeiden.
  const basisPoints = Math.round(commissionPct * 100);
  return Math.round((amountTotalCents * basisPoints) / 10_000);
}

/** Auszahlung an den Gesponserten in Cent: Gesamtbetrag minus Provision. */
export function calcPayoutAmount(amountTotalCents: number, commissionPct: number): number {
  return amountTotalCents - calcCommissionAmount(amountTotalCents, commissionPct);
}
