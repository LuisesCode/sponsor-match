import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatBlock } from "@/components/ui/StatBlock";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { ContactButton } from "@/components/app/ContactButton";
import { useSession } from "@/auth/SessionContext";
import { getDb } from "@/db/client";
import { getListingById, setListingStatus as setListingStatusRepo } from "@/db/repositories/listings";
import { getProfileById } from "@/db/repositories/profiles";
import { formatCentsRange, formatNumber, formatDate } from "@/lib/format";
import type { Category, Listing, ListingStatus, Profile } from "@/lib/types";
import { LISTING_DIRECTION_LABELS, LISTING_STATUS_CHOICES, LISTING_STATUS_LABELS } from "@/lib/validation/listing";
import { REGIONS } from "@/lib/validation/onboarding";

const REGION_LABELS = new Map<string, string>(REGIONS.map(([value, label]) => [value, label]));

function statusActionLabel(status: ListingStatus): string {
  switch (status) {
    case "active":
      return "Aktivieren";
    case "paused":
      return "Pausieren";
    case "closed":
      return "Schließen";
    default:
      return LISTING_STATUS_LABELS[status];
  }
}

/** Listing-Detailseite — Struktur 1:1 aus app/(app)/listings/[id]/page.tsx. */
export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useSession();
  const [listing, setListing] = React.useState<Listing | null | undefined>(undefined);
  const [author, setAuthor] = React.useState<Profile | null>(null);
  const [category, setCategory] = React.useState<Category | null>(null);

  const load = React.useCallback(async () => {
    if (!id) return;
    const db = await getDb();
    const l = getListingById(db, id);
    setListing(l);
    if (l) {
      setAuthor(getProfileById(db, l.author_profile_id));
      if (l.category_id) {
        const cat = db.exec("select * from categories where id = ?", [l.category_id]);
        if (cat[0]?.values[0]) {
          const cols = cat[0].columns;
          const vals = cat[0].values[0];
          setCategory(Object.fromEntries(cols.map((c, i) => [c, vals[i]])) as unknown as Category);
        }
      }
    }
  }, [id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (!profile || listing === undefined) return null;
  if (listing === null) {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-16) 0" }}>
        <h1 style={{ fontSize: "var(--fs-h2)" }}>Listing nicht gefunden</h1>
        <Link to="/listings">Zurück zu den Listings</Link>
      </div>
    );
  }

  const isOwn = author?.id === profile.id;
  const budget = formatCentsRange(listing.budget_min, listing.budget_max);
  const regionLabel = listing.region ? REGION_LABELS.get(listing.region) : null;
  const authorRegionLabel = author?.region ? REGION_LABELS.get(author.region) : null;

  const handleStatusChange = async (status: ListingStatus) => {
    const db = await getDb();
    setListingStatusRepo(db, listing.id, status);
    void load();
  };

  return (
    <div style={{ maxWidth: "var(--container-sm)", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div>
        <Link to="/listings" style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}>
          ← Zurück zu den Listings
        </Link>
      </div>

      <Card padding="lg">
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <Badge tone={listing.direction === "seeking_sponsor" ? "accent" : "primary"} size="sm">
            {LISTING_DIRECTION_LABELS[listing.direction]}
          </Badge>
          {(isOwn || listing.status !== "active") && (
            <Badge tone={listing.status === "active" ? "success" : "neutral"} size="sm">
              {LISTING_STATUS_LABELS[listing.status]}
            </Badge>
          )}
          {category && (
            <Badge tone="neutral" size="sm">
              {category.name}
            </Badge>
          )}
          {regionLabel && (
            <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", fontWeight: 600 }}>{regionLabel}</span>
          )}
        </div>
        <h1 style={{ fontSize: "var(--fs-h2)", margin: "var(--space-3) 0 0" }}>{listing.title}</h1>

        <div style={{ display: "flex", gap: "var(--space-10)", flexWrap: "wrap", marginTop: "var(--space-5)" }}>
          {budget && (
            <StatBlock value={budget} label={listing.direction === "offering_sponsorship" ? "Budget pro Deal" : "Preisvorstellung"} />
          )}
          {listing.reach_required != null && <StatBlock value={formatNumber(listing.reach_required)} label="Mindest-Reichweite" />}
          {listing.expires_at && <StatBlock value={formatDate(listing.expires_at)} label="Läuft ab am" />}
        </div>
      </Card>

      <Card padding="lg">
        <h2 style={{ fontSize: "var(--fs-h4)", marginBottom: "var(--space-3)" }}>Beschreibung</h2>
        <p style={{ margin: 0, lineHeight: "var(--lh-relaxed)", whiteSpace: "pre-line" }}>{listing.description}</p>
      </Card>

      {author && (
        <Card padding="lg">
          <h2 style={{ fontSize: "var(--fs-h4)", marginBottom: "var(--space-4)" }}>
            {listing.direction === "seeking_sponsor" ? "Wer dahintersteht" : "Wer sponsert"}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
            <Avatar name={author.display_name} src={author.avatar_url ?? undefined} size={56} verified={!!author.is_verified} />
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--fs-lg)" }}>
                  {author.display_name}
                </span>
                {!!author.is_verified && <VerifiedBadge type="verified" showLabel={false} size="sm" />}
              </div>
              <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", fontWeight: 600 }}>
                {[author.role === "sponsor" ? "Sponsor" : "Gesponserter", authorRegionLabel].filter(Boolean).join(" · ")}
              </span>
            </div>
            <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
              <Link to={`/profil/${author.slug}`} style={{ textDecoration: "none" }}>
                <Button variant="outline" size="sm">
                  Profil ansehen
                </Button>
              </Link>
              {!isOwn && profile.role !== "admin" && profile.role !== author.role && (
                <ContactButton counterpartProfileId={author.id} listingId={listing.id} />
              )}
            </div>
          </div>
        </Card>
      )}

      {isOwn && (
        <Card padding="lg">
          <h2 style={{ fontSize: "var(--fs-h4)", marginBottom: "var(--space-2)" }}>Status ändern</h2>
          <p style={{ margin: "0 0 var(--space-4)", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
            Nur aktive Listings erscheinen im Marktplatz. Geschlossene Listings kannst du jederzeit wieder aktivieren.
          </p>
          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
            {LISTING_STATUS_CHOICES.filter((s) => s !== listing.status).map((status) => (
              <Button
                key={status}
                type="button"
                variant={status === "active" ? "accent" : status === "closed" ? "danger" : "outline"}
                size="sm"
                onClick={() => void handleStatusChange(status)}
              >
                {statusActionLabel(status)}
              </Button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
