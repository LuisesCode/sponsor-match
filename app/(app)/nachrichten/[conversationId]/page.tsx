import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import type { Conversation, Message, Profile } from "@/lib/supabase/types";

import { ChatView } from "./ChatView";

type Params = { conversationId: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadConversation(
  conversationId: string
): Promise<{
  conversation: Conversation;
  counterpart: Profile | null;
  listingTitle: string | null;
  messages: Message[];
  myProfileId: string;
} | null> {
  if (!UUID_RE.test(conversationId)) return null;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  // RLS: nur Beteiligte sehen die Konversation.
  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conversation) return null;

  const counterpartId =
    conversation.sponsor_profile_id === profile.id
      ? conversation.sponsee_profile_id
      : conversation.sponsor_profile_id;

  const [{ data: counterpart }, listingResult, { data: messages }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", counterpartId).maybeSingle(),
    conversation.listing_id
      ? supabase.from("listings").select("id, title").eq("id", conversation.listing_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
  ]);

  return {
    conversation,
    counterpart,
    listingTitle: listingResult.data?.title ?? null,
    messages: messages ?? [],
    myProfileId: profile.id,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { conversationId } = await params;
  const data = await loadConversation(conversationId);
  return {
    title: data?.counterpart
      ? `Chat mit ${data.counterpart.display_name} — SponsorMatch`
      : "Nachrichten — SponsorMatch",
  };
}

/** Chatverlauf einer Konversation mit Realtime-Updates (M4). */
export default async function ConversationPage({ params }: { params: Promise<Params> }) {
  const { conversationId } = await params;
  const data = await loadConversation(conversationId);
  if (!data) notFound();

  const { conversation, counterpart, listingTitle, messages, myProfileId } = data;

  return (
    <div style={{ maxWidth: "var(--container-sm)", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <div>
        <Link href="/nachrichten" style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}>
          ← Alle Nachrichten
        </Link>
      </div>

      <Card padding="none">
        {/* Chat-Kopf: Gegenseite + Listing-Kontext */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-4)",
            padding: "var(--space-4) var(--space-5)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <Avatar
            name={counterpart?.display_name ?? "Gelöschtes Profil"}
            src={counterpart?.avatar_url ?? undefined}
            size={44}
            verified={counterpart?.is_verified}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              {counterpart ? (
                <Link
                  href={`/profil/${counterpart.slug}`}
                  style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--fs-lg)", color: "var(--text)", textDecoration: "none" }}
                >
                  {counterpart.display_name}
                </Link>
              ) : (
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--fs-lg)" }}>
                  Gelöschtes Profil
                </span>
              )}
              {counterpart?.is_verified && <VerifiedBadge type="verified" showLabel={false} size="sm" />}
            </div>
            {conversation.listing_id && (
              <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
                {listingTitle ? (
                  <>
                    zu{" "}
                    <Link href={`/listings/${conversation.listing_id}`} style={{ color: "var(--primary)", fontWeight: 600 }}>
                      „{listingTitle}“
                    </Link>
                  </>
                ) : (
                  "zu einem nicht mehr verfügbaren Listing"
                )}
              </span>
            )}
          </div>
        </div>

        <ChatView
          conversationId={conversation.id}
          myProfileId={myProfileId}
          counterpartName={counterpart?.display_name ?? "Gelöschtes Profil"}
          initialMessages={messages}
        />
      </Card>
    </div>
  );
}
