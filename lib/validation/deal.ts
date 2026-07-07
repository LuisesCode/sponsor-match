import { z } from "zod";

import { euroToCents } from "./onboarding";

/**
 * SponsorMatch — Validierung des Deal-Workflows (M5).
 * Beträge werden im Formular in Euro erfasst und nach Cent konvertiert.
 * Der Gesamtbetrag ergibt sich aus der Summe der Meilensteine — so kann es
 * nie eine Differenz zwischen amount_total und den Meilensteinen geben.
 */

export const DEAL_MILESTONES_MAX = 20;

const euroRequired = z.preprocess(
  euroToCents,
  z
    .number("Bitte gib einen gültigen Betrag an.")
    .int()
    .positive("Der Betrag muss über 0 liegen.")
    .max(100_000_000_00, "Der Betrag ist unrealistisch hoch.")
);

export const dealMilestoneSchema = z.object({
  title: z
    .string("Bitte gib dem Meilenstein einen Titel.")
    .trim()
    .min(3, "Meilenstein-Titel brauchen mindestens 3 Zeichen.")
    .max(120, "Meilenstein-Titel dürfen höchstens 120 Zeichen haben."),
  amount: euroRequired,
  dueDate: z
    .union([z.literal(""), z.iso.date("Bitte gib ein gültiges Datum an.")])
    .optional()
    .transform((v) => (v ? v : null)),
});

export type DealMilestoneFormInput = z.infer<typeof dealMilestoneSchema>;

const dealTermsShape = {
  title: z
    .string("Bitte gib einen Titel an.")
    .trim()
    .min(5, "Der Titel braucht mindestens 5 Zeichen.")
    .max(120, "Der Titel darf höchstens 120 Zeichen haben."),
  description: z
    .string("Bitte beschreib die Gegenleistungen.")
    .trim()
    .min(20, "Die Beschreibung braucht mindestens 20 Zeichen.")
    .max(5000, "Die Beschreibung darf höchstens 5000 Zeichen haben."),
  milestones: z
    .array(dealMilestoneSchema, "Bitte definiere mindestens einen Meilenstein.")
    .min(1, "Bitte definiere mindestens einen Meilenstein.")
    .max(DEAL_MILESTONES_MAX, `Höchstens ${DEAL_MILESTONES_MAX} Meilensteine sind möglich.`),
};

export const proposeDealSchema = z.object({
  conversationId: z.uuid(),
  ...dealTermsShape,
});

export const counterDealSchema = z.object({
  dealId: z.uuid(),
  ...dealTermsShape,
});

export type ProposeDealInput = z.infer<typeof proposeDealSchema>;
export type CounterDealInput = z.infer<typeof counterDealSchema>;

/** Gesamtbetrag in Cent = Summe der Meilensteine (Kontrakt der DB-Funktionen). */
export function sumMilestoneAmounts(milestones: { amount: number }[]): number {
  return milestones.reduce((sum, m) => sum + m.amount, 0);
}

/** Meilensteine kommen als JSON-String aus einem hidden input. */
export function parseMilestonesJson(raw: unknown): unknown {
  if (typeof raw !== "string" || raw.trim() === "") return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export const dealIdSchema = z.object({ dealId: z.uuid() });

export const declineDealSchema = dealIdSchema;

export const cancelDealSchema = z.object({
  dealId: z.uuid(),
  reason: z
    .string("Bitte gib eine Begründung an.")
    .trim()
    .min(5, "Die Begründung braucht mindestens 5 Zeichen.")
    .max(1000, "Die Begründung darf höchstens 1000 Zeichen haben."),
});
