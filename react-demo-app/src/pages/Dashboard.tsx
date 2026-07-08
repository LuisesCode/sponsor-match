import * as React from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatBlock } from "@/components/ui/StatBlock";
import { MatchCard } from "@/components/ui/MatchCard";
import { DealStatusBadge } from "@/components/app/DealStatusBadge";
import { useSession } from "@/auth/SessionContext";
import { getDb } from "@/db/client";
import { acceptContract, advanceDealStatus, getDealOverviews, type DealOverview } from "@/db/repositories/deals";
import { getUnreadMessageCount } from "@/db/repositories/conversations";
import { searchCandidates, type SearchResultItem } from "@/db/repositories/search";
import { DEAL_CLOSED_STATUSES, isDealNegotiable } from "@/lib/deals/status";
import { formatCents, formatMessageTimestamp } from "@/lib/format";

const sectionHeading: React.CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-display)",
  fontWeight: 800,
  fontSize: "var(--fs-lg)",
};

/**
 * Rollenabhängiges Dashboard — Übersicht über laufende Deals, offene
 * Anfragen (Annehmen/Verhandeln/Ablehnen direkt hier möglich) und passende
 * Vorschläge aus dem Matching. Vorbild: dashboard.tsx im Design-Handoff.
 */
export default function Dashboard() {
  const { profile } = useSession();
  const navigate = useNavigate();
  const [overviews, setOverviews] = React.useState<DealOverview[]>([]);
  const [suggestions, setSuggestions] = React.useState<SearchResultItem[]>([]);
  const [unreadMessages, setUnreadMessages] = React.useState(0);
  const [pendingDealId, setPendingDealId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!profile) return;
    const db = await getDb();
    setOverviews(getDealOverviews(db, profile.id));
    setUnreadMessages(getUnreadMessageCount(db, profile.id));
    setSuggestions(
      searchCandidates(db, profile, {
        categoryId: null,
        region: null,
        budgetMin: null,
        budgetMax: null,
        reachRequired: null,
      }).slice(0, 3)
    );
  }, [profile]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (!profile) return null;
  if (!profile.onboarding_completed) return <Navigate to="/onboarding" replace />;

  const isSponsor = profile.role === "sponsor";
  const openDeals = overviews.filter((o) => !DEAL_CLOSED_STATUSES.includes(o.deal.status));
  const doneDeals = overviews.filter((o) => o.deal.status === "completed");
  const actionDeals = overviews.filter((o) => isDealNegotiable(o.deal.status));
  const recentDeals = overviews.slice(0, 4);

  async function runAction(dealId: string, fn: (db: Awaited<ReturnType<typeof getDb>>) => void) {
    setPendingDealId(dealId);
    setError(null);
    try {
      const db = await getDb();
      fn(db);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Die Aktion konnte nicht ausgeführt werden.");
    } finally {
      setPendingDealId(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <div>
        <span className="fk-eyebrow">Dashboard</span>
        <h1 style={{ fontSize: "var(--fs-h1)", marginTop: "var(--space-1)" }}>
          Willkommen zurück, {profile.display_name}.
        </h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-4)" }}>
        <Card padding="lg">
          <StatBlock value={openDeals.length} label="Laufende Deals" />
        </Card>
        <Card padding="lg">
          <StatBlock value={doneDeals.length} label="Abgeschlossene Deals" />
        </Card>
        <Link to="/nachrichten" style={{ textDecoration: "none", color: "inherit" }}>
          <Card padding="lg">
            <StatBlock value={unreadMessages} label="Ungelesene Nachrichten" />
          </Card>
        </Link>
        <Card padding="lg">
          <StatBlock value={actionDeals.length} label="Anfragen warten auf dich" />
        </Card>
      </div>

      {error && (
        <p role="alert" style={{ margin: 0, color: "var(--danger)", fontSize: "var(--fs-sm)" }}>
          {error}
        </p>
      )}

      {actionDeals.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <h2 style={sectionHeading}>Deals, die auf dich warten</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {actionDeals.map(({ deal, counterpart, acceptedByMe }) => {
              const iAmProposer = deal.proposed_by_profile_id === profile.id;
              const pending = pendingDealId === deal.id;
              return (
                <Card key={deal.id} padding="lg">
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
                    <Avatar name={counterpart?.display_name ?? "Gelöschtes Profil"} src={counterpart?.avatar_url ?? undefined} size={40} verified={!!counterpart?.is_verified} />
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--fs-base)" }}>{deal.title}</span>
                        <DealStatusBadge status={deal.status} size="sm" />
                      </div>
                      <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
                        mit {counterpart?.display_name ?? "gelöschtem Profil"}
                      </span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "var(--fs-lg)" }}>
                      {formatCents(deal.amount_total)}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center", marginTop: "var(--space-4)" }}>
                    {acceptedByMe ? (
                      <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
                        Du hast zugestimmt — jetzt ist {counterpart?.display_name ?? "die Gegenseite"} dran.
                      </span>
                    ) : (
                      <Button type="button" variant="accent" size="sm" loading={pending} onClick={() => void runAction(deal.id, (db) => acceptContract(db, profile, deal.id))}>
                        Annehmen
                      </Button>
                    )}
                    <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/deals/${deal.id}`)}>
                      Verhandeln
                    </Button>
                    {!iAmProposer && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        loading={pending}
                        onClick={() => void runAction(deal.id, (db) => advanceDealStatus(db, profile, deal.id, "declined"))}
                      >
                        Ablehnen
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <h2 style={{ ...sectionHeading, flex: 1 }}>{isSponsor ? "Passende Talente für dich" : "Passende Sponsoren für dich"}</h2>
          <Link to="/suche" style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--primary)", textDecoration: "none" }}>
            Alle durchsuchen →
          </Link>
        </div>
        {suggestions.length === 0 ? (
          <Card padding="lg">
            <p style={{ margin: 0, color: "var(--text-muted)" }}>Noch keine Vorschläge — vervollständige dein Profil für bessere Matches.</p>
          </Card>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "var(--space-5)" }}>
            {suggestions.map((r) => (
              <MatchCard
                key={r.slug}
                name={r.name}
                category={r.category}
                location={r.location}
                avatarSrc={r.avatarSrc}
                verified={r.verified}
                matchScore={r.matchScore}
                priceFrom={r.priceFrom}
                stats={r.stats}
                tags={r.tags}
                onView={() => navigate(`/profil/${r.slug}`)}
              />
            ))}
          </div>
        )}
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <h2 style={{ ...sectionHeading, flex: 1 }}>Deine Deals</h2>
          <Link to="/deals" style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--primary)", textDecoration: "none" }}>
            Alle anzeigen →
          </Link>
        </div>
        {recentDeals.length === 0 ? (
          <Card padding="lg">
            <p style={{ margin: 0, color: "var(--text-muted)" }}>
              Noch keine Deals — starte eine{" "}
              <Link to="/nachrichten" style={{ color: "var(--primary)", fontWeight: 600 }}>
                Konversation
              </Link>{" "}
              und schlag deinem Match einen Deal vor.
            </p>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {recentDeals.map(({ deal, counterpart }) => (
              <Link key={deal.id} to={`/deals/${deal.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <Card padding="md">
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                    <Avatar name={counterpart?.display_name ?? "Gelöschtes Profil"} src={counterpart?.avatar_url ?? undefined} size={36} verified={!!counterpart?.is_verified} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{deal.title}</span>
                        <DealStatusBadge status={deal.status} size="sm" />
                      </div>
                      <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
                        mit {counterpart?.display_name ?? "gelöschtem Profil"} · zuletzt {formatMessageTimestamp(deal.updated_at)}
                      </span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, whiteSpace: "nowrap" }}>{formatCents(deal.amount_total)}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-4)" }}>
        <Card padding="lg">
          <Badge tone={isSponsor ? "primary" : "accent"} style={{ marginBottom: "var(--space-3)" }}>
            {isSponsor ? "Talente entdecken" : "Sponsoren finden"}
          </Badge>
          <p style={{ margin: "0 0 var(--space-4)", color: "var(--text-muted)" }}>
            {isSponsor
              ? "Durchsuche verifizierte Sportler, Vereine und Creator nach Kategorie, Region und Budget."
              : "Finde Sponsoren, die zu deiner Kategorie und deinem Publikum passen."}
          </p>
          <Link to="/suche">
            <Button variant="primary">Zur Suche</Button>
          </Link>
        </Card>
        <Card padding="lg">
          <Badge tone="neutral" style={{ marginBottom: "var(--space-3)" }}>
            Listings
          </Badge>
          <p style={{ margin: "0 0 var(--space-4)", color: "var(--text-muted)" }}>
            Verwalte deine Ausschreibungen oder durchsuche den Marktplatz.
          </p>
          <Link to="/listings">
            <Button variant="secondary">Zu den Listings</Button>
          </Link>
        </Card>
        <Card padding="lg">
          <Badge tone="neutral" style={{ marginBottom: "var(--space-3)" }}>
            Nachrichten
          </Badge>
          <p style={{ margin: "0 0 var(--space-4)", color: "var(--text-muted)" }}>
            Bespreche laufende Deal-Vorschläge direkt im Chat mit deinem Match.
          </p>
          <Link to="/nachrichten">
            <Button variant="secondary">Zu den Nachrichten</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
