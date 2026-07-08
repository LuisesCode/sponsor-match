import { Navigate, Link } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/auth/SessionContext";

/**
 * Rollenabhängiges Dashboard — hier bewusst schlank gehalten (KPIs/Analytics
 * sind im Original erst M8 und nicht Teil dieses Rebuilds, siehe Plan).
 * Startpunkt in die bereits gebauten Bereiche.
 */
export default function Dashboard() {
  const { profile } = useSession();
  if (!profile) return null;
  if (!profile.onboarding_completed) return <Navigate to="/onboarding" replace />;

  const isSponsor = profile.role === "sponsor";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div>
        <span className="fk-eyebrow">Dashboard</span>
        <h1 style={{ fontSize: "var(--fs-h1)", marginTop: "var(--space-1)" }}>
          Willkommen zurück, {profile.display_name}.
        </h1>
      </div>

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
            Nachrichten & Deals
          </Badge>
          <p style={{ margin: "0 0 var(--space-4)", color: "var(--text-muted)" }}>
            Behalte laufende Gespräche und Deal-Vorschläge im Blick.
          </p>
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <Link to="/nachrichten">
              <Button variant="secondary">Nachrichten</Button>
            </Link>
            <Link to="/deals">
              <Button variant="secondary">Deals</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
