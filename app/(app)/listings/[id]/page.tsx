import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatBlock } from "@/components/ui/StatBlock";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { formatCentsRange, formatNumber } from "@/lib/format";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import type { Category, Listing, ListingStatus, Profile } from "@/lib/supabase/types";
import {
  LISTING_DIRECTION_LABELS,
  LISTING_STATUS_CHOICES,
  LISTING_STATUS_LABELS,
} from "@/lib/validation/listing";
import { REGIONS } from "@/lib/validation/onboarding";

import { ContactButton } from "../../nachrichten/ContactButton";
import { setListingStatus } from "../actions";

const REGION_LABELS = new Map<string, string>(REGIONS.map(([value, label]) => [value, label]));

const DATE_FORMAT = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

type Params = { id: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadListing(id: string): Promise<{
  listing: Listing;
  author: Profile | null;
  category: Category | null;
} | null> {
  if (!UUID_RE.test(id)) return null;
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!listing) return null;

  const [{ data: author }, categoryResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", listing.author_profile_id).maybeSingle(),
    listing.category_id
      ? supabase.from("categories").select("*").eq("id", listing.category_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return { listing, author, category: categoryResult.data ?? null };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await loadListing(id);
  return {
    title: data ? `${data.listing.title} — SponsorMatch` : "Listing nicht gefunden — SponsorMatch",
  };
}

/** Listing-Detailseite mit Autor-Karte und Kontakt-CTA-Platzhalter (Chat folgt in M4). */
export default async function ListingDetailPage({ params }: { params: Promise<Params> }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { id } = await params;
  const data = await loadListing(id);
  if (!data) notFound();

  const { listing, author, category } = data;
  const isOwn = author?.id === profile.id;
  const budget = formatCentsRange(listing.budget_min, listing.budget_max);
  const regionLabel = listing.region ? REGION_LABELS.get(listing.region) : null;
  const authorRegionLabel = author?.region ? REGION_LABELS.get(author.region) : null;

  return (
    <div style={{ maxWidth: "var(--container-sm)", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div>
        <Link href="/listings" style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}>
          ← Zurück zu den Listings
        </Link>
      </div>

      {/* Kopf */}
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
            <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", fontWeight: 600 }}>
              {regionLabel}
            </span>
          )}
        </div>
        <h1 style={{ fontSize: "var(--fs-h2)", margin: "var(--space-3) 0 0" }}>{listing.title}</h1>

        <div style={{ display: "flex", gap: "var(--space-10)", flexWrap: "wrap", marginTop: "var(--space-5)" }}>
          {budget && (
            <StatBlock
              value={budget}
              label={listing.direction === "offering_sponsorship" ? "Budget pro Deal" : "Preisvorstellung"}
            />
          )}
          {listing.reach_required != null && (
            <StatBlock value={formatNumber(listing.reach_required)} label="Mindest-Reichweite" />
          )}
          {listing.expires_at && (
            <StatBlock value={DATE_FORMAT.format(new Date(listing.expires_at))} label="Läuft ab am" />
          )}
        </div>
      </Card>

      {/* Beschreibung */}
      <Card padding="lg">
        <h2 style={{ fontSize: "var(--fs-h4)", marginBottom: "var(--space-3)" }}>Beschreibung</h2>
        <p style={{ margin: 0, lineHeight: "var(--lh-relaxed)", whiteSpace: "pre-line" }}>
          {listing.description}
        </p>
      </Card>

      {/* Autor-Karte */}
      {author && (
        <Card padding="lg">
          <h2 style={{ fontSize: "var(--fs-h4)", marginBottom: "var(--space-4)" }}>
            {listing.direction === "seeking_sponsor" ? "Wer dahintersteht" : "Wer sponsert"}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
            <Avatar name={author.display_name} src={author.avatar_url ?? undefined} size={56} verified={author.is_verified} />
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--fs-lg)" }}>
                  {author.display_name}
                </span>
                {author.is_verified && <VerifiedBadge type="verified" showLabel={false} size="sm" />}
              </div>
              <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", fontWeight: 600 }}>
                {[author.role === "sponsor" ? "Sponsor" : "Gesponserter", authorRegionLabel]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
            <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
              <Link href={`/profil/${author.slug}`} style={{ textDecoration: "none" }}>
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

      {/* Statuswechsel für eigene Listings */}
      {isOwn && (
        <Card padding="lg">
          <h2 style={{ fontSize: "var(--fs-h4)", marginBottom: "var(--space-2)" }}>Status ändern</h2>
          <p style={{ margin: "0 0 var(--space-4)", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
            Nur aktive Listings erscheinen im Marktplatz. Geschlossene Listings kannst du jederzeit
            wieder aktivieren.
          </p>
          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
            {LISTING_STATUS_CHOICES.filter((s) => s !== listing.status).map((status) => (
              <form key={status} action={setListingStatus}>
                <input type="hidden" name="listingId" value={listing.id} />
                <input type="hidden" name="status" value={status} />
                <Button
                  type="submit"
                  variant={status === "active" ? "accent" : status === "closed" ? "danger" : "outline"}
                  size="sm"
                >
                  {statusActionLabel(status)}
                </Button>
              </form>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

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
