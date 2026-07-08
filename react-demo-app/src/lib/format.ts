/**
 * Flenzko — deutsche Zahl-/Betragsformatierung (vgl. Design-Guide §2:
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

const timeFormat = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" });
const dateFormat = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** "04.07.2026" (auch für reine Datumswerte wie "2026-07-04"). */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

/** "14:32" */
export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

/**
 * Zeitstempel für Nachrichtenlisten: heute → "14:32",
 * gestern → "Gestern", sonst → "04.07.2026".
 */
export function formatMessageTimestamp(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (isSameDay(date, now)) return timeFormat.format(date);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return "Gestern";
  return dateFormat.format(date);
}

/** Tages-Trenner im Chatverlauf: "Heute", "Gestern" oder "04.07.2026". */
export function formatDayLabel(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (isSameDay(date, now)) return "Heute";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return "Gestern";
  return dateFormat.format(date);
}

/** Cent → Euro-Eingabewert für Formulare: 150000 → "1500", 100050 → "1000,50". */
export function centsToEuroInput(cents: number): string {
  if (cents % 100 === 0) return String(cents / 100);
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** Preis-/Budgetspanne: "€500 – €5.000", "ab €500", "bis €5.000" oder null. */
export function formatCentsRange(min: number | null, max: number | null): string | null {
  if (min != null && max != null) return `${formatCents(min)} – ${formatCents(max)}`;
  if (min != null) return `ab ${formatCents(min)}`;
  if (max != null) return `bis ${formatCents(max)}`;
  return null;
}
