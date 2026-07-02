import { z } from "zod";

/**
 * SponsorMatch — Validierung des Onboarding-Wizards (M2).
 * Beträge werden im Formular in Euro erfasst und hier nach Cent konvertiert.
 */

/** Auswahloptionen für Zielgruppen-Altersgruppen (UI & Validierung teilen sich diese Liste). */
export const AGE_GROUPS = ["13–17", "18–24", "25–34", "35–44", "45+"] as const;

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"] as const;

export const SPONSEE_TYPES = ["athlete", "club", "creator"] as const;

export const SPONSEE_TYPE_LABELS: Record<(typeof SPONSEE_TYPES)[number], string> = {
  athlete: "Sportler:in",
  club: "Verein",
  creator: "Creator:in",
};

export const REGIONS = [
  ["baden_wuerttemberg", "Baden-Württemberg"],
  ["bayern", "Bayern"],
  ["berlin", "Berlin"],
  ["brandenburg", "Brandenburg"],
  ["bremen", "Bremen"],
  ["hamburg", "Hamburg"],
  ["hessen", "Hessen"],
  ["mecklenburg_vorpommern", "Mecklenburg-Vorpommern"],
  ["niedersachsen", "Niedersachsen"],
  ["nordrhein_westfalen", "Nordrhein-Westfalen"],
  ["rheinland_pfalz", "Rheinland-Pfalz"],
  ["saarland", "Saarland"],
  ["sachsen", "Sachsen"],
  ["sachsen_anhalt", "Sachsen-Anhalt"],
  ["schleswig_holstein", "Schleswig-Holstein"],
  ["thueringen", "Thüringen"],
  ["at", "Österreich"],
  ["ch", "Schweiz"],
] as const;

const regionValues = REGIONS.map(([value]) => value) as [string, ...string[]];

/** "1.200" / "1200,50" (Euro) → Cent; leere Eingabe → null. */
export function euroToCents(raw: unknown): number | null | undefined {
  if (raw == null || raw === "") return null;
  if (typeof raw !== "string" && typeof raw !== "number") return undefined;
  const normalized = String(raw).trim().replace(/\./g, "").replace(",", ".");
  if (normalized === "") return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.round(parsed * 100);
}

const euroField = z.preprocess(
  euroToCents,
  z
    .number("Bitte gib einen gültigen Betrag an.")
    .int()
    .max(100_000_000_00, "Der Betrag ist unrealistisch hoch.")
    .nullable()
);

const optionalUrl = z
  .union([
    z.literal(""),
    z.url({ protocol: /^https?$/, error: "Bitte gib eine gültige URL an (inkl. https://)." }),
  ])
  .optional()
  .transform((v) => (v ? v : null));

/** Gemeinsame Basisfelder beider Rollen (landen in `profiles`). */
const baseSchema = z.object({
  bio: z
    .string()
    .trim()
    .max(2000, "Die Beschreibung darf höchstens 2000 Zeichen haben.")
    .optional()
    .transform((v) => (v ? v : null)),
  region: z.enum(regionValues, "Bitte wähle deine Region."),
  website: optionalUrl,
  ageGroups: z.array(z.enum(AGE_GROUPS)).default([]),
  interests: z
    .array(z.string().trim().min(1).max(40))
    .max(12, "Höchstens 12 Interessen.")
    .default([]),
});

export const sponsorOnboardingSchema = baseSchema
  .extend({
    companyName: z
      .string("Bitte gib den Firmennamen an.")
      .trim()
      .min(2, "Der Firmenname braucht mindestens 2 Zeichen.")
      .max(120, "Der Firmenname darf höchstens 120 Zeichen haben."),
    industryId: z.uuid("Bitte wähle eine Branche."),
    companySize: z.enum(COMPANY_SIZES).nullish(),
    budgetMin: euroField,
    budgetMax: euroField,
    vatId: z
      .string()
      .trim()
      .max(20, "Die USt-IdNr. darf höchstens 20 Zeichen haben.")
      .optional()
      .transform((v) => (v ? v : null)),
  })
  .refine(
    (d) => d.budgetMin == null || d.budgetMax == null || d.budgetMin <= d.budgetMax,
    { path: ["budgetMax"], error: "Das Maximalbudget muss über dem Minimum liegen." }
  );

export const sponseeOnboardingSchema = baseSchema
  .extend({
    type: z.enum(SPONSEE_TYPES, "Bitte wähle, wer du bist."),
    categoryId: z.uuid("Bitte wähle eine Kategorie."),
    reachTotal: z.preprocess(
      (v) => (v == null || v === "" ? null : Number(String(v).replace(/[.\s]/g, ""))),
      z
        .number("Bitte gib deine Reichweite als Zahl an.")
        .int("Bitte gib deine Reichweite als ganze Zahl an.")
        .min(0)
        .max(2_000_000_000)
        .nullable()
    ),
    instagram: optionalUrl,
    tiktok: optionalUrl,
    youtube: optionalUrl,
    pastSponsors: z
      .array(z.string().trim().min(1).max(80))
      .max(20, "Höchstens 20 bisherige Sponsoren.")
      .default([]),
    priceMin: euroField,
    priceMax: euroField,
  })
  .refine(
    (d) => d.priceMin == null || d.priceMax == null || d.priceMin <= d.priceMax,
    { path: ["priceMax"], error: "Der Maximalpreis muss über dem Minimum liegen." }
  );

export type SponsorOnboardingInput = z.infer<typeof sponsorOnboardingSchema>;
export type SponseeOnboardingInput = z.infer<typeof sponseeOnboardingSchema>;

/** Mediakit-Upload: nur PDF bis 10 MB (Bucket erzwingt das serverseitig ebenfalls). */
export const MEDIA_KIT_MAX_BYTES = 10 * 1024 * 1024;

export function validateMediaKit(file: File): string | null {
  if (file.size === 0) return null; // kein Upload gewählt
  if (file.type !== "application/pdf") return "Das Mediakit muss eine PDF-Datei sein.";
  if (file.size > MEDIA_KIT_MAX_BYTES) return "Das Mediakit darf höchstens 10 MB groß sein.";
  return null;
}
