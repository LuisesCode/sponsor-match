import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatMessageTimestamp } from "@/lib/format";
import { getCurrentProfile } from "@/lib/supabase/profile";

import { getConversationOverviews } from "./data";

export const metadata: Metadata = { title: "Nachrichten — SponsorMatch" };

/** Konversationsliste mit letzter Nachricht und Ungelesen-Zähler. */
export default async function MessagesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const overviews = await getConversationOverviews(profile.id);

  return (
    <div style={{ maxWidth: "var(--container-sm)", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div>
        <h1 style={{ fontSize: "var(--fs-h2)", margin: 0 }}>Nachrichten</h1>
        <p style={{ margin: "var(--space-2) 0 0", color: "var(--text-muted)" }}>
          Deine Konversationen mit {profile.role === "sponsor" ? "Sportlern, Vereinen und Creators" : "Sponsoren"}.
        </p>
      </div>

      {overviews.length === 0 ? (
        <Card padding="lg">
          <p style={{ margin: 0, color: "var(--text-muted)" }}>
            Noch keine Konversationen — starte eine über den Kontakt-Button auf einem
            Listing oder Profil, das zu dir passt.
          </p>
          <p style={{ margin: "var(--space-3) 0 0" }}>
            <Link href="/suche" style={{ fontWeight: 600, color: "var(--primary)" }}>
              Passende Matches entdecken →
            </Link>
          </p>
        </Card>
      ) : (
        <Card padding="none">
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {overviews.map(({ conversation, counterpart, listingTitle, lastMessage, unreadCount }, i) => (
              <li
                key={conversation.id}
                style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}
              >
                <Link
                  href={`/nachrichten/${conversation.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-4)",
                    padding: "var(--space-4) var(--space-5)",
                    textDecoration: "none",
                    color: "var(--text)",
                  }}
                >
                  <Avatar
                    name={counterpart?.display_name ?? "Gelöschtes Profil"}
                    src={counterpart?.avatar_url ?? undefined}
                    size={44}
                    verified={counterpart?.is_verified}
                  />
                  <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: unreadCount > 0 ? 800 : 700,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {counterpart?.display_name ?? "Gelöschtes Profil"}
                      </span>
                      {listingTitle && (
                        <span
                          style={{
                            fontSize: "var(--fs-xs)",
                            color: "var(--text-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          zu „{listingTitle}“
                        </span>
                      )}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--fs-sm)",
                        color: unreadCount > 0 ? "var(--text)" : "var(--text-muted)",
                        fontWeight: unreadCount > 0 ? 600 : 400,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {lastMessage
                        ? (lastMessage.sender_profile_id === profile.id ? "Du: " : "") + lastMessage.body
                        : "Noch keine Nachrichten — schreib die erste."}
                    </span>
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    {lastMessage && (
                      <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {formatMessageTimestamp(lastMessage.created_at)}
                      </span>
                    )}
                    {unreadCount > 0 && (
                      <Badge tone="energy" size="sm">
                        <span style={{ fontFamily: "var(--font-mono)" }}>{unreadCount}</span>
                      </Badge>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
