/**
 * SponsorMatch — deutsche Zahl-/Betragsformatierung (vgl. Design-Guide §2:
 * Dezimalkomma, Tausenderpunkt, €-Präfix, Beträge in Mono-Schrift).
 */

const numberFormat = new Intl.NumberFormat("de-DE");

/** 128000 → "128.000" */
export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** Cent → "€1.200" bzw. "€1.200,50" (Nachkommastellen nur wenn nötig). */
export function formatCents(cents: number): string {
  const euros = cents / 100;
  const hasCents = cents % 100 !== 0;
  return (
    "€" +
    new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: hasCents ? 2 : 0,
    }).format(euros)
  );
}

/** Preis-/Budgetspanne: "€500 – €5.000", "ab €500", "bis €5.000" oder null. */
export function formatCentsRange(min: number | null, max: number | null): string | null {
  if (min != null && max != null) return `${formatCents(min)} – ${formatCents(max)}`;
  if (min != null) return `ab ${formatCents(min)}`;
  if (max != null) return `bis ${formatCents(max)}`;
  return null;
}
