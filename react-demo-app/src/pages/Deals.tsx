import * as React from "react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { DealStatusBadge } from "@/components/app/DealStatusBadge";
import { useSession } from "@/auth/SessionContext";
import { getDb } from "@/db/client";
import { getDealOverviews, type DealOverview } from "@/db/repositories/deals";
import { formatCents, formatMessageTimestamp } from "@/lib/format";

/** Deal-Übersicht — Struktur 1:1 aus app/(app)/deals/page.tsx. */
export default function Deals() {
  const { profile } = useSession();
  const [overviews, setOverviews] = React.useState<DealOverview[]>([]);

  React.useEffect(() => {
    if (!profile) return;
    void (async () => {
      const db = await getDb();
      setOverviews(getDealOverviews(db, profile.id));
    })();
  }, [profile]);

  if (!profile) return null;

  return (
    <div style={{ maxWidth: "var(--container-sm)", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--fs-h1)", letterSpacing: "-0.03em" }}>
          Deals
        </h1>
        <p style={{ margin: "var(--space-2) 0 0", color: "var(--text-muted)" }}>
          Deine Sponsoring-Deals — vom Angebot bis zum Abschluss. Neue Deals schlägst du direkt aus einer{" "}
          <Link to="/nachrichten" style={{ color: "var(--primary)", fontWeight: 600 }}>
            Konversation
          </Link>{" "}
          heraus vor.
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
            <Link key={deal.id} to={`/deals/${deal.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <Card>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                  <Avatar name={counterpart?.display_name ?? "Gelöschtes Profil"} src={counterpart?.avatar_url ?? undefined} size={44} verified={!!counterpart?.is_verified} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--fs-lg)" }}>{deal.title}</span>
                      <DealStatusBadge status={deal.status} size="sm" />
                    </div>
                    <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
                      mit {counterpart?.display_name ?? "gelöschtem Profil"} · zuletzt {formatMessageTimestamp(deal.updated_at)}
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
