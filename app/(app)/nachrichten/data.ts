import { createClient } from "@/lib/supabase/server";
import type { Conversation, Message, Profile } from "@/lib/supabase/types";

/** Eintrag der Konversationsliste auf /nachrichten. */
export type ConversationOverview = {
  conversation: Conversation;
  /** Profil der Gegenseite (null, falls gelöscht). */
  counterpart: Profile | null;
  /** Titel des zugehörigen Listings (null ohne Listing oder ohne Leserecht). */
  listingTitle: string | null;
  lastMessage: Message | null;
  unreadCount: number;
};

/**
 * Konversationen des Nutzers mit Gegenseite, letzter Nachricht und
 * Ungelesen-Zähler; sortiert nach letzter Aktivität (updated_at wird
 * vom Nachrichten-Trigger angefasst).
 */
export async function getConversationOverviews(
  myProfileId: string
): Promise<ConversationOverview[]> {
  const supabase = await createClient();

  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error || !conversations || conversations.length === 0) {
    if (error) console.error("Konversationen laden fehlgeschlagen:", error);
    return [];
  }

  const counterpartIds = conversations.map((c) =>
    c.sponsor_profile_id === myProfileId ? c.sponsee_profile_id : c.sponsor_profile_id
  );
  const listingIds = conversations
    .map((c) => c.listing_id)
    .filter((id): id is string => id != null);

  const [{ data: profiles }, { data: listings }] = await Promise.all([
    supabase.from("profiles").select("*").in("id", counterpartIds),
    listingIds.length > 0
      ? supabase.from("listings").select("id, title").in("id", listingIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const listingTitleById = new Map((listings ?? []).map((l) => [l.id, l.title]));

  return Promise.all(
    conversations.map(async (conversation) => {
      const [lastResult, unreadResult] = await Promise.all([
        supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conversation.id)
          .neq("sender_profile_id", myProfileId)
          .is("read_at", null),
      ]);

      const counterpartId =
        conversation.sponsor_profile_id === myProfileId
          ? conversation.sponsee_profile_id
          : conversation.sponsor_profile_id;

      return {
        conversation,
        counterpart: profileById.get(counterpartId) ?? null,
        listingTitle: conversation.listing_id
          ? (listingTitleById.get(conversation.listing_id) ?? null)
          : null,
        lastMessage: lastResult.data,
        unreadCount: unreadResult.count ?? 0,
      };
    })
  );
}

/**
 * Anzahl ungelesener Nachrichten des Nutzers über alle Konversationen
 * (RLS begrenzt auf die eigenen; für das Header-Badge).
 */
export async function getUnreadMessageCount(myProfileId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .neq("sender_profile_id", myProfileId)
    .is("read_at", null);
  if (error) {
    console.error("Ungelesen-Zähler fehlgeschlagen:", error);
    return 0;
  }
  return count ?? 0;
}
