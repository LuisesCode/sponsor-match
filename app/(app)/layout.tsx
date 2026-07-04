import Link from "next/link";
import { redirect } from "next/navigation";

import { logout } from "@/app/(auth)/actions";
import { getUnreadMessageCount } from "@/app/(app)/nachrichten/data";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getCurrentProfile } from "@/lib/supabase/profile";
import type { ProfileRole } from "@/lib/supabase/types";

const ROLE_LABELS: Record<ProfileRole, string> = {
  sponsor: "Sponsor",
  sponsee: "Gesponserter",
  admin: "Admin",
};

/**
 * Layout des eingeloggten Bereichs. proxy.ts leitet Unangemeldete bereits
 * um — der Check hier ist die zweite Verteidigungslinie auf Datenebene.
 */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const unreadCount = await getUnreadMessageCount(profile.id);

  return (
    <>
      <header
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
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
          <Link href="/dashboard" aria-label="Zum Dashboard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-wordmark.svg" alt="SponsorMatch" style={{ height: 28 }} className="sm-light-only" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-wordmark-dark.svg" alt="SponsorMatch" style={{ height: 28 }} className="sm-dark-only" />
          </Link>
          <nav
            className="sm-hide-sm"
            style={{ display: "flex", alignItems: "center", gap: "var(--space-5)", flex: 1, marginLeft: "var(--space-6)" }}
          >
            {[
              ["/suche", "Suche"],
              ["/listings", "Listings"],
              ["/nachrichten", "Nachrichten"],
              ["/profil/bearbeiten", "Mein Profil"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  fontSize: "var(--fs-sm)",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textDecoration: "none",
                }}
              >
                {label}
                {href === "/nachrichten" && unreadCount > 0 && (
                  <Badge tone="energy" size="sm" aria-label={`${unreadCount} ungelesene Nachrichten`}>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{unreadCount}</span>
                  </Badge>
                )}
              </Link>
            ))}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <span
              className="sm-hide-sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-2)",
                fontSize: "var(--fs-sm)",
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              {profile.display_name}
              <Badge tone={profile.role === "sponsor" ? "primary" : "accent"} size="sm">
                {ROLE_LABELS[profile.role]}
              </Badge>
            </span>
            <form action={logout}>
              <Button type="submit" variant="outline" size="sm">
                Abmelden
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: "var(--container)",
          margin: "0 auto",
          padding: "var(--space-8) var(--gutter)",
        }}
      >
        {children}
      </main>
    </>
  );
}
