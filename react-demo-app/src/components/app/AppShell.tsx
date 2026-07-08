import * as React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/marketing/Logo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/auth/SessionContext";
import { getDb } from "@/db/client";
import { getUnreadMessageCount } from "@/db/repositories/conversations";
import type { ProfileRole } from "@/lib/types";

const ROLE_LABELS: Record<ProfileRole, string> = {
  sponsor: "Sponsor",
  sponsee: "Gesponserter",
  admin: "Admin",
};

const NAV_LINKS: [string, string][] = [
  ["/suche", "Suche"],
  ["/listings", "Listings"],
  ["/nachrichten", "Nachrichten"],
  ["/deals", "Deals"],
  ["/profil/bearbeiten", "Mein Profil"],
];

/** Layout des eingeloggten Bereichs — Struktur 1:1 aus app/(app)/layout.tsx. */
export function AppShell() {
  const { profile, logout } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (!profile) return;
    void (async () => {
      const db = await getDb();
      setUnreadCount(getUnreadMessageCount(db, profile.id));
    })();
    // Beim Wechsel der Route neu prüfen (z.B. nach Verlassen eines Chats).
  }, [profile, location.pathname]);

  if (!profile) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div
          style={{
            maxWidth: "var(--container)",
            margin: "0 auto",
            padding: "0 var(--gutter)",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-4)",
          }}
        >
          <Link to="/dashboard" aria-label="Zum Dashboard">
            <Logo tone="navy" height={28} className="fk-light-only" />
            <Logo tone="white" height={28} className="fk-dark-only" />
          </Link>
          <nav className="fk-hide-sm" style={{ display: "flex", alignItems: "center", gap: "var(--space-5)", flex: 1, marginLeft: "var(--space-6)" }}>
            {NAV_LINKS.map(([to, label]) => (
              <Link
                key={to}
                to={to}
                style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}
              >
                {label}
                {to === "/nachrichten" && unreadCount > 0 && (
                  <Badge tone="energy" size="sm" aria-label={`${unreadCount} ungelesene Nachrichten`}>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{unreadCount}</span>
                  </Badge>
                )}
              </Link>
            ))}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <span className="fk-hide-sm" style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text)" }}>
              {profile.display_name}
              <Badge tone={profile.role === "sponsor" ? "primary" : "accent"} size="sm">
                {ROLE_LABELS[profile.role]}
              </Badge>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Abmelden
            </Button>
          </div>
        </div>
      </header>
      <main style={{ flex: 1, width: "100%", maxWidth: "var(--container)", margin: "0 auto", padding: "var(--space-8) var(--gutter)" }}>
        <Outlet />
      </main>
    </div>
  );
}
