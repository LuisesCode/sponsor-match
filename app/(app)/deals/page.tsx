import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { formatCents, formatMessageTimestamp } from "@/lib/format";
import { getCurrentProfile } from "@/lib/supabase/profile";

import { getDealOverviews } from "./data";
import { DealStatusBadge } from "./DealStatusBadge";

export const metadata: Metadata = { title: "Deals — SponsorMatch" };

/** Deal-Übersicht: alle Deals, an denen der Nutzer beteiligt ist (M5). */
export default async function DealsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.onboarding_completed) redirect("/onboarding");

  const overviews = await getDealOverviews(profile.id);

  return (
    <div style={{ maxWidth: "var(--container-sm)", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--fs-3xl)", letterSpacing: "-0.03em" }}>
          Deals
        </h1>
        <p style={{ margin: "var(--space-2) 0 0", color: "var(--text-muted)" }}>
          Deine Sponsoring-Deals — vom Angebot bis zum Abschluss. Neue Deals schlägst du
          direkt aus einer <Link href="/nachrichten" style={{ color: "var(--primary)", fontWeight: 600 }}>Konversation</Link> heraus vor.
        </p>
      </div>

      {overviews.length === 0 ? (
        <Card>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>
            Noch keine Deals — starte eine Konversation und schlag deinem Match einen Deal vor.
          </p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {overviews.map(({ deal, counterpart }) => (
            <Link key={deal.id} href={`/deals/${deal.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <Card interactive>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                  <Avatar
                    name={counterpart?.display_name ?? "Gelöschtes Profil"}
                    src={counterpart?.avatar_url ?? undefined}
                    size={44}
                    verified={counterpart?.is_verified}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--fs-lg)" }}>
                        {deal.title}
                      </span>
                      <DealStatusBadge status={deal.status} size="sm" />
                    </div>
                    <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
                      mit {counterpart?.display_name ?? "gelöschtem Profil"} · zuletzt{" "}
                      {formatMessageTimestamp(deal.updated_at)}
                    </span>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "var(--fs-lg)", whiteSpace: "nowrap" }}>
                    {formatCents(deal.amount_total)}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
