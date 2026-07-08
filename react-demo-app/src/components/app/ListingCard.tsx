import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatCentsRange, formatNumber } from "@/lib/format";
import type { Listing, Profile } from "@/lib/types";
import { LISTING_DIRECTION_LABELS, LISTING_STATUS_LABELS } from "@/lib/validation/listing";
import { REGIONS } from "@/lib/validation/onboarding";

const REGION_LABELS = new Map<string, string>(REGIONS.map(([value, label]) => [value, label]));

export interface ListingCardProps {
  listing: Listing;
  author?: Pick<Profile, "display_name" | "slug" | "avatar_url" | "is_verified"> | null;
  categoryName?: string | null;
  showStatus?: boolean;
}

/** Kompakte Listing-Karte für Übersicht & Marktplatz — 1:1 aus dem Original. */
export function ListingCard({ listing, author, categoryName, showStatus = false }: ListingCardProps) {
  const budget = formatCentsRange(listing.budget_min, listing.budget_max);
  const regionLabel = listing.region ? REGION_LABELS.get(listing.region) : null;

  return (
    <Link to={`/listings/${listing.id}`} style={{ textDecoration: "none", display: "block" }}>
      <Card padding="lg" style={{ height: "100%", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <Badge tone={listing.direction === "seeking_sponsor" ? "accent" : "primary"} size="sm">
            {LISTING_DIRECTION_LABELS[listing.direction]}
          </Badge>
          {showStatus && (
            <Badge tone={listing.status === "active" ? "success" : "neutral"} size="sm">
              {LISTING_STATUS_LABELS[listing.status]}
            </Badge>
          )}
          {categoryName && (
            <Badge tone="neutral" size="sm">
              {categoryName}
            </Badge>
          )}
        </div>

        <h3 style={{ fontSize: "var(--fs-h4)", margin: "var(--space-3) 0 var(--space-2)", color: "var(--text)" }}>
          {listing.title}
        </h3>
        <p
          style={{
            margin: 0,
            color: "var(--text-muted)",
            fontSize: "var(--fs-sm)",
            lineHeight: "var(--lh-relaxed)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {listing.description}
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-3)",
            marginTop: "var(--space-4)",
            paddingTop: "var(--space-4)",
            borderTop: "1px solid var(--border)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {budget && (
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text)" }}>{budget}</span>
            )}
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)", fontWeight: 600 }}>
              {[regionLabel, listing.reach_required != null ? `ab ${formatNumber(listing.reach_required)} Reichweite` : null]
                .filter(Boolean)
                .join(" · ") || "Ganzer DACH-Raum"}
            </span>
          </div>
          {author && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Avatar name={author.display_name} src={author.avatar_url ?? undefined} size={28} />
              <span style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text)" }}>
                {author.display_name}
              </span>
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
