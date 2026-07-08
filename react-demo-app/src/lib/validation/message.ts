import { z } from "zod";

/**
 * Flenzko — Validierung für Nachrichten (M4).
 * Grenzen entsprechen den DB-Constraints (body 1–2000 Zeichen).
 */

export const MESSAGE_MAX_LENGTH = 2000;

export const messageSchema = z.object({
  conversationId: z.uuid("Ungültige Konversation."),
  body: z
    .string("Bitte schreib eine Nachricht.")
    .trim()
    .min(1, "Bitte schreib eine Nachricht.")
    .max(MESSAGE_MAX_LENGTH, `Deine Nachricht darf höchstens ${MESSAGE_MAX_LENGTH} Zeichen haben.`),
});

export type MessageInput = z.infer<typeof messageSchema>;

/** Konversation starten — vom Kontakt-CTA auf Listing- oder Profilseite. */
export const startConversationSchema = z.object({
  // Profil der Gegenseite (Autor des Listings bzw. Profilinhaber).
  counterpartProfileId: z.uuid("Ungültiges Profil."),
  listingId: z
    .union([z.literal(""), z.uuid("Ungültiges Listing.")])
    .optional()
    .transform((v) => (v ? v : null)),
});

export type StartConversationInput = z.infer<typeof startConversationSchema>;
