import * as React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ListingCard } from "@/components/app/ListingCard";
import { useSession } from "@/auth/SessionContext";
import { getDb } from "@/db/client";
import { listOwnListings, listMarketListings } from "@/db/repositories/listings";
import { getProfileById } from "@/db/repositories/profiles";
import type { Listing, Profile } from "@/lib/types";

/** Marktplatz-Übersicht — Struktur 1:1 aus app/(app)/listings/page.tsx. */
export default function Listings() {
  const { profile } = useSession();
  const [own, setOwn] = React.useState<Listing[]>([]);
  const [market, setMarket] = React.useState<Listing[]>([]);
  const [authors, setAuthors] = React.useState<Map<string, Profile>>(new Map());
  const [categoryNames, setCategoryNames] = React.useState<Map<string, string>>(new Map());

  React.useEffect(() => {
    if (!profile) return;
    void (async () => {
      const db = await getDb();
      const ownListings = listOwnListings(db, profile.id);
      const marketListings = listMarketListings(db, profile.id);
      setOwn(ownListings);
      setMarket(marketListings);

      const authorIds = [...new Set(marketListings.map((l) => l.author_profile_id))];
      const authorMap = new Map<string, Profile>();
      for (const id of authorIds) {
        const a = getProfileById(db, id);
        if (a) authorMap.set(id, a);
      }
      setAuthors(authorMap);

      const cats = db.exec("select id, name from categories");
      const names = new Map<string, string>();
      if (cats[0]) {
        for (const [id, name] of cats[0].values as [string, string][]) names.set(id, name);
      }
      setCategoryNames(names);
    })();
  }, [profile]);

  if (!profile) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
        <div>
          <span className="fk-eyebrow">Marktplatz</span>
          <h1 style={{ fontSize: "var(--fs-h1)", margin: "var(--space-2) 0 0" }}>Listings</h1>
        </div>
        {profile.role !== "admin" && (
          <Link to="/listings/neu" style={{ textDecoration: "none" }}>
            <Button variant="primary">Listing erstellen</Button>
          </Link>
        )}
      </div>

      <section>
        <h2 style={{ fontSize: "var(--fs-h3)", marginBottom: "var(--space-4)" }}>Deine Listings</h2>
        {own.length === 0 ? (
          <Card padding="lg">
            <p style={{ margin: 0, color: "var(--text-muted)" }}>
              Du hast noch kein Listing. Erstell eins, damit die andere Seite dich findet.
            </p>
          </Card>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--space-4)" }}>
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

      <section>
        <h2 style={{ fontSize: "var(--fs-h3)", marginBottom: "var(--space-4)" }}>Aktive Ausschreibungen</h2>
        {market.length === 0 ? (
          <Card padding="lg">
            <p style={{ margin: 0, color: "var(--text-muted)" }}>
              Noch keine aktiven Ausschreibungen — schau später wieder vorbei.
            </p>
          </Card>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--space-4)" }}>
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
