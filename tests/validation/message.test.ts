import { describe, expect, it } from "vitest";

import {
  MESSAGE_MAX_LENGTH,
  messageSchema,
  startConversationSchema,
} from "@/lib/validation/message";

const CONVERSATION_ID = "6f1e8a4e-3b2c-4d5e-9f0a-1b2c3d4e5f6a";
const PROFILE_ID = "0a1b2c3d-4e5f-4a7b-8c9d-0e1f2a3b4c5d";
const LISTING_ID = "9e8d7c6b-5a4f-4e3d-a2c1-b0a9f8e7d6c5";

describe("messageSchema", () => {
  it("akzeptiert eine normale Nachricht und trimmt sie", () => {
    const result = messageSchema.safeParse({
      conversationId: CONVERSATION_ID,
      body: "  Hallo, dein Listing passt super zu uns!  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body).toBe("Hallo, dein Listing passt super zu uns!");
    }
  });

  it("lehnt leere Nachrichten mit deutscher Meldung ab", () => {
    const result = messageSchema.safeParse({ conversationId: CONVERSATION_ID, body: "   " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Bitte schreib eine Nachricht.");
    }
  });

  it("lehnt zu lange Nachrichten ab", () => {
    const result = messageSchema.safeParse({
      conversationId: CONVERSATION_ID,
      body: "a".repeat(MESSAGE_MAX_LENGTH + 1),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("2000 Zeichen");
    }
  });

  it("lehnt ungültige Konversations-IDs ab", () => {
    const result = messageSchema.safeParse({ conversationId: "nope", body: "Hi" });
    expect(result.success).toBe(false);
  });
});

describe("startConversationSchema", () => {
  it("akzeptiert Gegenseite mit Listing", () => {
    const result = startConversationSchema.safeParse({
      counterpartProfileId: PROFILE_ID,
      listingId: LISTING_ID,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.listingId).toBe(LISTING_ID);
  });

  it("wandelt fehlendes/leeres Listing in null um", () => {
    for (const listingId of ["", undefined]) {
      const result = startConversationSchema.safeParse({
        counterpartProfileId: PROFILE_ID,
        listingId,
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.listingId).toBeNull();
    }
  });

  it("lehnt ungültige Profil-IDs ab", () => {
    const result = startConversationSchema.safeParse({ counterpartProfileId: "abc" });
    expect(result.success).toBe(false);
  });
});
