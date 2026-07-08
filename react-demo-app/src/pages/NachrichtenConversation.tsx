import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { ChatView } from "@/components/app/ChatView";
import { useSession } from "@/auth/SessionContext";
import { getDb } from "@/db/client";
import { getConversationById } from "@/db/repositories/conversations";
import { getProfileById } from "@/db/repositories/profiles";
import { getOpenDealForConversation } from "@/db/repositories/deals";
import { DealStatusBadge } from "@/components/app/DealStatusBadge";
import type { Conversation, Deal, Profile } from "@/lib/types";

/** Chat-Ansicht einer Konversation — Struktur 1:1 aus [conversationId]/page.tsx. */
export default function NachrichtenConversation() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { profile } = useSession();
  const [data, setData] = React.useState<
    | { conversation: Conversation; counterpart: Profile | null; listingTitle: string | null; openDeal: Deal | null }
    | null
    | undefined
  >(undefined);

  React.useEffect(() => {
    if (!conversationId || !profile) return;
    void (async () => {
      const db = await getDb();
      const conversation = getConversationById(db, conversationId);
      if (!conversation) {
        setData(null);
        return;
      }
      const counterpartId =
        conversation.sponsor_profile_id === profile.id ? conversation.sponsee_profile_id : conversation.sponsor_profile_id;
      const counterpart = getProfileById(db, counterpartId);
      const listingTitle = conversation.listing_id
        ? (db.exec("select title from listings where id = ?", [conversation.listing_id])[0]?.values[0]?.[0] as
            | string
            | undefined) ?? null
        : null;
      const openDeal = getOpenDealForConversation(db, conversation.id);
      setData({ conversation, counterpart, listingTitle, openDeal });
    })();
  }, [conversationId, profile]);

  if (!profile || data === undefined) return null;
  if (data === null) {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-16) 0" }}>
        <h1 style={{ fontSize: "var(--fs-h2)" }}>Konversation nicht gefunden</h1>
      </div>
    );
  }

  const { conversation, counterpart, listingTitle, openDeal } = data;

  return (
    <div style={{ maxWidth: "var(--container-sm)", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <div>
        <Link to="/nachrichten" style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}>
          ← Alle Nachrichten
        </Link>
      </div>

      <Card padding="none">
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
            verified={!!counterpart?.is_verified}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              {counterpart ? (
                <Link
                  to={`/profil/${counterpart.slug}`}
                  style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--fs-lg)", color: "var(--text)", textDecoration: "none" }}
                >
                  {counterpart.display_name}
                </Link>
              ) : (
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--fs-lg)" }}>Gelöschtes Profil</span>
              )}
              {!!counterpart?.is_verified && <VerifiedBadge type="verified" showLabel={false} size="sm" />}
            </div>
            {conversation.listing_id && (
              <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
                {listingTitle ? (
                  <>
                    zu{" "}
                    <Link to={`/listings/${conversation.listing_id}`} style={{ color: "var(--primary)", fontWeight: 600 }}>
                      „{listingTitle}“
                    </Link>
                  </>
                ) : (
                  "zu einem nicht mehr verfügbaren Listing"
                )}
              </span>
            )}
          </div>
          {counterpart &&
            (openDeal ? (
              <Link to={`/deals/${openDeal.id}`} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
                <DealStatusBadge status={openDeal.status} size="sm" />
                <Button variant="outline" size="sm">
                  Zum Deal
                </Button>
              </Link>
            ) : (
              <Link to={`/deals/neu?conversation=${conversation.id}`} style={{ textDecoration: "none" }}>
                <Button variant="accent" size="sm">
                  Deal vorschlagen
                </Button>
              </Link>
            ))}
        </div>

        <ChatView
          conversationId={conversation.id}
          myProfileId={profile.id}
          counterpartName={counterpart?.display_name ?? "Gelöschtes Profil"}
        />
      </Card>
    </div>
  );
}
