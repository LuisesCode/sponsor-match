import type { SqlDatabase } from "../client";
import { select, selectOne, exec, newId, nowIso } from "../query";
import type { Conversation, Message, Profile } from "@/lib/types";
import { createNotification } from "./notifications";

export type ConversationOverview = {
  conversation: Conversation;
  counterpart: Profile | null;
  listingTitle: string | null;
  lastMessage: Message | null;
  unreadCount: number;
};

/** Konversation starten (oder bestehende wiederverwenden) — 1:1 aus actions.ts. */
export function startConversation(
  db: SqlDatabase,
  viewer: Profile,
  counterpartProfileId: string,
  listingId: string | null
): { id: string } | { error: string } {
  const counterpart = selectOne<Profile>(db, "select * from profiles where id = ?", [
    counterpartProfileId,
  ]);
  const rolesMatch =
    counterpart &&
    ((viewer.role === "sponsor" && counterpart.role === "sponsee") ||
      (viewer.role === "sponsee" && counterpart.role === "sponsor"));
  if (!counterpart || !rolesMatch) {
    return { error: "Dieses Profil kannst du nicht kontaktieren." };
  }

  const sponsorProfileId = viewer.role === "sponsor" ? viewer.id : counterpart.id;
  const sponseeProfileId = viewer.role === "sponsee" ? viewer.id : counterpart.id;

  const existing = listingId
    ? selectOne<Conversation>(
        db,
        "select * from conversations where sponsor_profile_id = ? and sponsee_profile_id = ? and listing_id = ?",
        [sponsorProfileId, sponseeProfileId, listingId]
      )
    : selectOne<Conversation>(
        db,
        "select * from conversations where sponsor_profile_id = ? and sponsee_profile_id = ? and listing_id is null",
        [sponsorProfileId, sponseeProfileId]
      );
  if (existing) return { id: existing.id };

  const id = newId();
  const now = nowIso();
  exec(
    db,
    "insert into conversations (id, listing_id, sponsor_profile_id, sponsee_profile_id, created_at, updated_at) values (?, ?, ?, ?, ?, ?)",
    [id, listingId, sponsorProfileId, sponseeProfileId, now, now]
  );
  return { id };
}

export function getConversationById(db: SqlDatabase, id: string): Conversation | null {
  return selectOne<Conversation>(db, "select * from conversations where id = ?", [id]);
}

export function getConversationOverviews(db: SqlDatabase, myProfileId: string): ConversationOverview[] {
  const conversations = select<Conversation>(
    db,
    "select * from conversations where sponsor_profile_id = ? or sponsee_profile_id = ? order by updated_at desc",
    [myProfileId, myProfileId]
  );

  return conversations.map((conversation) => {
    const counterpartId =
      conversation.sponsor_profile_id === myProfileId
        ? conversation.sponsee_profile_id
        : conversation.sponsor_profile_id;
    const counterpart = selectOne<Profile>(db, "select * from profiles where id = ?", [counterpartId]);
    const listingTitle = conversation.listing_id
      ? selectOne<{ title: string }>(db, "select title from listings where id = ?", [conversation.listing_id])
          ?.title ?? null
      : null;
    const lastMessage = selectOne<Message>(
      db,
      "select * from messages where conversation_id = ? order by created_at desc limit 1",
      [conversation.id]
    );
    const unreadCount =
      select<{ n: number }>(
        db,
        "select count(*) as n from messages where conversation_id = ? and sender_profile_id != ? and read_at is null",
        [conversation.id, myProfileId]
      )[0]?.n ?? 0;

    return { conversation, counterpart, listingTitle, lastMessage, unreadCount };
  });
}

export function getUnreadMessageCount(db: SqlDatabase, myProfileId: string): number {
  return (
    select<{ n: number }>(
      db,
      `select count(*) as n from messages
       where sender_profile_id != ? and read_at is null
         and conversation_id in (
           select id from conversations where sponsor_profile_id = ? or sponsee_profile_id = ?
         )`,
      [myProfileId, myProfileId, myProfileId]
    )[0]?.n ?? 0
  );
}

export function getMessages(db: SqlDatabase, conversationId: string): Message[] {
  return select<Message>(db, "select * from messages where conversation_id = ? order by created_at asc", [
    conversationId,
  ]);
}

/** Nachricht senden + conversations.updated_at bumpen (Original: Trigger handle_new_message). */
export function sendMessage(
  db: SqlDatabase,
  conversationId: string,
  senderProfileId: string,
  body: string
): Message {
  const id = newId();
  const now = nowIso();
  exec(db, "insert into messages (id, conversation_id, sender_profile_id, body, read_at, created_at) values (?, ?, ?, ?, null, ?)", [
    id,
    conversationId,
    senderProfileId,
    body,
    now,
  ]);
  exec(db, "update conversations set updated_at = ? where id = ?", [now, conversationId]);

  const conversation = selectOne<Conversation>(db, "select * from conversations where id = ?", [conversationId]);
  if (conversation) {
    const recipientId =
      conversation.sponsor_profile_id === senderProfileId
        ? conversation.sponsee_profile_id
        : conversation.sponsor_profile_id;
    createNotification(db, recipientId, "new_message", {
      conversation_id: conversationId,
      message_id: id,
      sender_profile_id: senderProfileId,
      actor_profile_id: senderProfileId,
    });
  }

  return selectOne<Message>(db, "select * from messages where id = ?", [id])!;
}

/** Empfangene Nachrichten als gelesen markieren (beim Öffnen des Chats). */
export function markConversationRead(db: SqlDatabase, conversationId: string, viewerProfileId: string): void {
  exec(
    db,
    "update messages set read_at = ? where conversation_id = ? and sender_profile_id != ? and read_at is null",
    [nowIso(), conversationId, viewerProfileId]
  );
}
