import { z } from "zod";

/**
 * Versionen der Rechtstexte, denen bei Registrierung zugestimmt wird.
 * Bei Änderung der Texte hochzählen — alte Nachweise bleiben in `consents`.
 * // TODO: rechtlich prüfen (AGB-/Datenschutz-Texte und Versionierung)
 */
export const CONSENT_VERSIONS = {
  terms: "2026-06-12",
  privacy: "2026-06-12",
} as const;

export const emailSchema = z
  .string("Bitte gib deine E-Mail-Adresse an.")
  .trim()
  .toLowerCase()
  .pipe(z.email("Bitte gib eine gültige E-Mail-Adresse an."));

export const registerSchema = z.object({
  role: z.enum(["sponsor", "sponsee"], "Bitte wähle eine Rolle."),
  displayName: z
    .string("Bitte gib einen Anzeigenamen an.")
    .trim()
    .min(2, "Der Anzeigename braucht mindestens 2 Zeichen.")
    .max(80, "Der Anzeigename darf höchstens 80 Zeichen haben."),
  email: emailSchema,
  password: z
    .string("Bitte wähle ein Passwort.")
    .min(8, "Das Passwort braucht mindestens 8 Zeichen.")
    .max(72, "Das Passwort darf höchstens 72 Zeichen haben."),
  acceptTerms: z.literal(
    true,
    "Bitte stimme den AGB und der Datenschutzerklärung zu."
  ),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string("Bitte gib dein Passwort an.")
    .min(1, "Bitte gib dein Passwort an."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Erlaubt nur app-interne Rücksprungziele (Schutz vor Open-Redirects),
 * z.B. aus `?next=` nach dem Login.
 */
export function sanitizeNextPath(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return fallback;
  }
  return raw;
}
