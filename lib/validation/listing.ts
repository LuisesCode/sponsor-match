import { z } from "zod";

import type { ListingDirection, ListingStatus } from "@/lib/supabase/types";

import { REGIONS, euroToCents } from "./onboarding";

const regionValues = REGIONS.map(([value]) => value) as [string, ...string[]];

/**
 * SponsorMatch — Validierung für Listings (M3).
 * Beträge werden im Formular in Euro erfasst und nach Cent konvertiert.
 */

export const LISTING_DIRECTION_LABELS: Record<ListingDirection, string> = {
  seeking_sponsor: "Sucht Sponsor",
  offering_sponsorship: "Bietet Sponsoring",
};

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  draft: "Entwurf",
  active: "Aktiv",
  paused: "Pausiert",
  closed: "Geschlossen",
};

/** Status, die der Autor selbst setzen darf (Statuswechsel auf der Detailseite). */
export const LISTING_STATUS_CHOICES = ["active", "paused", "closed"] as const;

const euroField = z.preprocess(
  euroToCents,
  z
    .number("Bitte gib einen gültigen Betrag an.")
    .int()
    .max(100_000_000_00, "Der Betrag ist unrealistisch hoch.")
    .nullable()
);

export const listingSchema = z
  .object({
    title: z
      .string("Bitte gib einen Titel an.")
      .trim()
      .min(5, "Der Titel braucht mindestens 5 Zeichen.")
      .max(120, "Der Titel darf höchstens 120 Zeichen haben."),
    description: z
      .string("Bitte beschreib dein Angebot.")
      .trim()
      .min(20, "Die Beschreibung braucht mindestens 20 Zeichen.")
      .max(5000, "Die Beschreibung darf höchstens 5000 Zeichen haben."),
    categoryId: z
      .union([z.literal(""), z.uuid("Bitte wähle eine gültige Kategorie.")])
      .optional()
      .transform((v) => (v ? v : null)),
    region: z
      .union([z.literal(""), z.enum(regionValues, "Bitte wähle eine gültige Region.")])
      .optional()
      .transform((v) => (v ? v : null)),
    budgetMin: euroField,
    budgetMax: euroField,
    reachRequired: z.preprocess(
      (v) => (v == null || v === "" ? null : Number(String(v).replace(/[.\s]/g, ""))),
      z
        .number("Bitte gib die Mindest-Reichweite als Zahl an.")
        .int("Bitte gib die Mindest-Reichweite als ganze Zahl an.")
        .min(0)
        .max(2_000_000_000)
        .nullable()
    ),
    expiresAt: z
      .union([z.literal(""), z.iso.date("Bitte gib ein gültiges Datum an.")])
      .optional()
      .transform((v) => (v ? v : null)),
    status: z.enum(["draft", "active"], "Bitte wähle einen Status.").default("active"),
  })
  .refine(
    (d) => d.budgetMin == null || d.budgetMax == null || d.budgetMin <= d.budgetMax,
    { path: ["budgetMax"], error: "Das Maximum muss über dem Minimum liegen." }
  )
  .refine(
    (d) => d.expiresAt == null || new Date(d.expiresAt + "T23:59:59") >= new Date(),
    { path: ["expiresAt"], error: "Das Ablaufdatum darf nicht in der Vergangenheit liegen." }
  );

export type ListingInput = z.infer<typeof listingSchema>;

export const listingStatusSchema = z.object({
  listingId: z.uuid(),
  status: z.enum(LISTING_STATUS_CHOICES, "Ungültiger Status."),
});
