import * as React from "react";
import { useParams } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatBlock } from "@/components/ui/StatBlock";
import { Tag } from "@/components/ui/Tag";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { ContactButton } from "@/components/app/ContactButton";
import { useSession } from "@/auth/SessionContext";
import { getDb } from "@/db/client";
import { getProfileBySlug, getSponsorProfile, getSponseeProfile } from "@/db/repositories/profiles";
import { formatCentsRange, formatNumber } from "@/lib/format";
import type { Category, Profile as ProfileType, SponseeProfile, SponsorProfile } from "@/lib/types";
import { REGIONS, SPONSEE_TYPE_LABELS } from "@/lib/validation/onboarding";

const REGION_LABELS = new Map<string, string>(REGIONS.map(([value, label]) => [value, label]));

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitch: "Twitch",
  website: "Website",
};

/** Öffentliches Profil — Struktur 1:1 aus app/(app)/profil/[slug]/page.tsx. */
export default function Profile() {
  const { slug } = useParams<{ slug: string }>();
  const { profile: viewer } = useSession();
  const [data, setData] = React.useState<{
    profile: ProfileType;
    sponsor: SponsorProfile | null;
    sponsee: SponseeProfile | null;
    category: Category | null;
  } | null | undefined>(undefined);

  React.useEffect(() => {
    if (!slug) return;
    void (async () => {
      const db = await getDb();
      const profile = getProfileBySlug(db, slug);
      if (!profile) {
        setData(null);
        return;
      }
      const sponsor = profile.role === "sponsor" ? getSponsorProfile(db, profile.id) : null;
      const sponsee = profile.role === "sponsee" ? getSponseeProfile(db, profile.id) : null;
      const categoryId = sponsor?.industry_id ?? sponsee?.category_id ?? null;
      let category: Category | null = null;
      if (categoryId) {
        const rows = db.exec("select * from categories where id = ?", [categoryId]);
        if (rows[0]?.values[0]) {
          const cols = rows[0].columns;
          category = Object.fromEntries(cols.map((c, i) => [c, rows[0].values[0][i]])) as unknown as Category;
        }
      }
      setData({ profile, sponsor, sponsee, category });
    })();
  }, [slug]);

  if (data === undefined) return null;
  if (data === null) {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-16) 0" }}>
        <h1 style={{ fontSize: "var(--fs-h2)" }}>Profil nicht gefunden</h1>
      </div>
    );
  }

  const { profile, sponsor, sponsee, category } = data;
  const regionLabel = profile.region ? REGION_LABELS.get(profile.region) : null;
  const canContact =
    viewer != null &&
    viewer.id !== profile.id &&
    ((viewer.role === "sponsor" && profile.role === "sponsee") || (viewer.role === "sponsee" && profile.role === "sponsor"));

  const audience = sponsor?.target_audience ?? sponsee?.audience ?? {};
  const interests = audience.interests ?? [];
  const ageGroups = audience.age_groups ?? [];
  const priceRange = sponsee
    ? formatCentsRange(sponsee.price_min, sponsee.price_max)
    : sponsor
      ? formatCentsRange(sponsor.budget_min, sponsor.budget_max)
      : null;

  const socialEntries = sponsee ? (Object.entries(sponsee.social_links) as [string, string][]) : [];

  return (
    <div style={{ maxWidth: "var(--container-sm)", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <Card padding="none">
        <div style={{ height: 120, background: "linear-gradient(120deg, var(--clay-600), var(--sage-600))" }} />
        <div style={{ padding: "0 var(--space-6) var(--space-6)", marginTop: -40 }}>
          <Avatar
            name={profile.display_name}
            src={profile.avatar_url ?? undefined}
            size={80}
            verified={!!profile.is_verified}
            style={{ border: "4px solid var(--surface)", borderRadius: "50%" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginTop: "var(--space-3)", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "var(--fs-h2)", margin: 0 }}>{profile.display_name}</h1>
            {!!profile.is_verified && <VerifiedBadge type="verified" size="sm" />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-2)", flexWrap: "wrap" }}>
            <Badge tone={profile.role === "sponsor" ? "primary" : "accent"} size="sm">
              {profile.role === "sponsor" ? "Sponsor" : sponsee ? SPONSEE_TYPE_LABELS[sponsee.type] : "Gesponserter"}
            </Badge>
            {category && (
              <Badge tone="neutral" size="sm">
                {category.name}
              </Badge>
            )}
            {regionLabel && <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", fontWeight: 600 }}>{regionLabel}</span>}
          </div>
          {sponsor && (
            <p style={{ margin: "var(--space-3) 0 0", fontFamily: "var(--font-display)", fontWeight: 700 }}>
              {sponsor.company_name}
              {sponsor.company_size && (
                <span style={{ color: "var(--text-muted)", fontWeight: 400, fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)" }}>
                  {" "}
                  · {sponsor.company_size} Mitarbeitende
                </span>
              )}
            </p>
          )}
          {canContact && (
            <div style={{ marginTop: "var(--space-4)" }}>
              <ContactButton counterpartProfileId={profile.id} label="Nachricht senden" />
            </div>
          )}
        </div>
      </Card>

      {profile.bio && (
        <Card padding="lg">
          <h2 style={{ fontSize: "var(--fs-h4)", marginBottom: "var(--space-3)" }}>
            {profile.role === "sponsor" ? "Über das Unternehmen" : "Über mich"}
          </h2>
          <p style={{ margin: 0, color: "var(--text)", lineHeight: "var(--lh-relaxed)", whiteSpace: "pre-line" }}>{profile.bio}</p>
        </Card>
      )}

      <Card padding="lg">
        <div style={{ display: "flex", gap: "var(--space-10)", flexWrap: "wrap" }}>
          {sponsee?.reach_total != null && <StatBlock value={formatNumber(sponsee.reach_total)} label="Reichweite gesamt" />}
          {priceRange && <StatBlock value={priceRange} label={profile.role === "sponsor" ? "Budget pro Deal" : "Preis pro Deal"} />}
          {sponsee && sponsee.past_sponsors.length > 0 && (
            <StatBlock value={String(sponsee.past_sponsors.length)} label="Bisherige Sponsoren" />
          )}
        </div>

        {(interests.length > 0 || ageGroups.length > 0) && (
          <div style={{ marginTop: "var(--space-5)", paddingTop: "var(--space-5)", borderTop: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", marginBottom: "var(--space-3)", fontFamily: "var(--font-body)", fontWeight: 600 }}>
              Zielgruppe
            </h3>
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
              {ageGroups.map((g) => (
                <Tag key={g}>{g} Jahre</Tag>
              ))}
              {interests.map((i) => (
                <Tag key={i}>{i}</Tag>
              ))}
            </div>
          </div>
        )}

        {sponsee && sponsee.past_sponsors.length > 0 && (
          <div style={{ marginTop: "var(--space-5)", paddingTop: "var(--space-5)", borderTop: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", marginBottom: "var(--space-3)", fontFamily: "var(--font-body)", fontWeight: 600 }}>
              Bisherige Sponsoren
            </h3>
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
              {sponsee.past_sponsors.map((s) => (
                <Tag key={s}>{s}</Tag>
              ))}
            </div>
          </div>
        )}
      </Card>

      {(socialEntries.length > 0 || profile.website) && (
        <Card padding="lg">
          <h2 style={{ fontSize: "var(--fs-h4)", marginBottom: "var(--space-4)" }}>Links</h2>
          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
            {socialEntries.map(([key, url]) => (
              <Button key={key} as="a" href={url} variant="outline" size="sm" rel="noopener noreferrer" target="_blank">
                {SOCIAL_LABELS[key] ?? key}
              </Button>
            ))}
            {profile.website && (
              <Button as="a" href={profile.website} variant="outline" size="sm" rel="noopener noreferrer" target="_blank">
                Website
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
