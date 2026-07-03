import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import type { Listing, Profile } from "@/lib/supabase/types";

import { ListingCard } from "./ListingCard";

export const metadata: Metadata = {
  title: "Listings — SponsorMatch",
};

/** Marktplatz-Übersicht: eigene Listings getrennt von aktiven Ausschreibungen. */
export default async function ListingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.onboarding_completed) redirect("/onboarding");

  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [{ data: ownListings }, { data: marketListings, error: marketError }, { data: categories }] =
    await Promise.all([
      supabase
        .from("listings")
        .select("*")
        .eq("author_profile_id", profile.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("listings")
        .select("*")
        .eq("status", "active")
        .neq("author_profile_id", profile.id)
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .order("created_at", { ascending: false })
        .limit(60),
      supabase.from("categories").select("id, name"),
    ]);

  const categoryNames = new Map((categories ?? []).map((c) => [c.id, c.name]));

  // Autoren der Marktplatz-Listings nachladen (RLS: Marktplatz liest Profile).
  const authorIds = [...new Set((marketListings ?? []).map((l) => l.author_profile_id))];
  let authors = new Map<string, Profile>();
  if (authorIds.length > 0) {
    const { data } = await supabase.from("profiles").select("*").in("id", authorIds);
    authors = new Map((data ?? []).map((p) => [p.id, p]));
  }

  const own = (ownListings ?? []) as Listing[];
  const market = (marketListings ?? []) as Listing[];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
        <div>
          <span className="sm-eyebrow">Marktplatz</span>
          <h1 style={{ fontSize: "var(--fs-h1)", margin: "var(--space-2) 0 0" }}>Listings</h1>
        </div>
        {profile.role !== "admin" && (
          <Link href="/listings/neu" style={{ textDecoration: "none" }}>
            <Button variant="primary">Listing erstellen</Button>
          </Link>
        )}
      </div>

      {/* Eigene Listings */}
      <section>
        <h2 style={{ fontSize: "var(--fs-h3)", marginBottom: "var(--space-4)" }}>Deine Listings</h2>
        {own.length === 0 ? (
          <Card padding="lg">
            <p style={{ margin: 0, color: "var(--text-muted)" }}>
              Du hast noch kein Listing. Erstell eins, damit die andere Seite dich findet.
            </p>
          </Card>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "var(--space-4)",
            }}
          >
            {own.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                categoryName={listing.category_id ? categoryNames.get(listing.category_id) : null}
                showStatus
              />
            ))}
          </div>
        )}
      </section>

      {/* Marktplatz */}
      <section>
        <h2 style={{ fontSize: "var(--fs-h3)", marginBottom: "var(--space-4)" }}>
          Aktive Ausschreibungen
        </h2>
        {marketError ? (
          <Card padding="lg">
            <p style={{ margin: 0, color: "var(--danger)" }}>
              Die Listings konnten gerade nicht geladen werden. Bitte versuch es gleich noch einmal.
            </p>
          </Card>
        ) : market.length === 0 ? (
          <Card padding="lg">
            <p style={{ margin: 0, color: "var(--text-muted)" }}>
              Noch keine aktiven Ausschreibungen — schau später wieder vorbei.
            </p>
          </Card>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "var(--space-4)",
            }}
          >
            {market.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                author={authors.get(listing.author_profile_id)}
                categoryName={listing.category_id ? categoryNames.get(listing.category_id) : null}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
