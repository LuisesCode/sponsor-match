import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatBlock } from "@/components/ui/StatBlock";
import { Tag } from "@/components/ui/Tag";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { formatCentsRange, formatNumber } from "@/lib/format";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  Profile,
  SponseeProfile,
  SponsorProfile,
} from "@/lib/supabase/types";
import { REGIONS, SPONSEE_TYPE_LABELS } from "@/lib/validation/onboarding";

import { ContactButton } from "../../nachrichten/ContactButton";

const REGION_LABELS = new Map<string, string>(REGIONS.map(([value, label]) => [value, label]));

type Params = { slug: string };

async function loadProfile(slug: string): Promise<{
  profile: Profile;
  sponsor: SponsorProfile | null;
  sponsee: SponseeProfile | null;
  category: Category | null;
  mediaKitUrl: string | null;
} | null> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (!profile) return null;

  let sponsor: SponsorProfile | null = null;
  let sponsee: SponseeProfile | null = null;
  let categoryId: string | null = null;

  if (profile.role === "sponsor") {
    const { data } = await supabase
      .from("sponsor_profiles")
      .select("*")
      .eq("profile_id", profile.id)
      .maybeSingle();
    sponsor = data;
    categoryId = data?.industry_id ?? null;
  } else if (profile.role === "sponsee") {
    const { data } = await supabase
      .from("sponsee_profiles")
      .select("*")
      .eq("profile_id", profile.id)
      .maybeSingle();
    sponsee = data;
    categoryId = data?.category_id ?? null;
  }

  let category: Category | null = null;
  if (categoryId) {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("id", categoryId)
      .maybeSingle();
    category = data;
  }

  // Privater Bucket → signierte URL (1 Stunde gültig).
  let mediaKitUrl: string | null = null;
  if (sponsee?.media_kit_path) {
    const { data } = await supabase.storage
      .from("media-kits")
      .createSignedUrl(sponsee.media_kit_path, 3600);
    mediaKitUrl = data?.signedUrl ?? null;
  }

  return { profile, sponsor, sponsee, category, mediaKitUrl };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadProfile(slug);
  return {
    title: data
      ? `${data.profile.display_name} — SponsorMatch`
      : "Profil nicht gefunden — SponsorMatch",
  };
}

/** Öffentliches Profil (für eingeloggte Nutzer — Marktplatz). */
export default async function ProfilePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const [data, viewer] = await Promise.all([loadProfile(slug), getCurrentProfile()]);
  if (!data) notFound();

  const { profile, sponsor, sponsee, category, mediaKitUrl } = data;
  const regionLabel = profile.region ? REGION_LABELS.get(profile.region) : null;
  // Kontakt nur zwischen den beiden Marktplatz-Seiten (Sponsor ↔ Gesponserter).
  const canContact =
    viewer != null &&
    viewer.id !== profile.id &&
    ((viewer.role === "sponsor" && profile.role === "sponsee") ||
      (viewer.role === "sponsee" && profile.role === "sponsor"));

  const audience = sponsor?.target_audience ?? sponsee?.audience ?? {};
  const interests = audience.interests ?? [];
  const ageGroups = audience.age_groups ?? [];
  const priceRange = sponsee
    ? formatCentsRange(sponsee.price_min, sponsee.price_max)
    : sponsor
      ? formatCentsRange(sponsor.budget_min, sponsor.budget_max)
      : null;

  const socialEntries = sponsee
    ? (Object.entries(sponsee.social_links) as [string, string][])
    : [];
  const SOCIAL_LABELS: Record<string, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
    twitch: "Twitch",
    website: "Website",
  };

  return (
    <div style={{ maxWidth: "var(--container-sm)", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Kopf: Cover-Gradient + Identität */}
      <Card padding="none">
        <div style={{ height: 120, background: "linear-gradient(120deg, var(--navy-600), var(--teal-600))" }} />
        <div style={{ padding: "0 var(--space-6) var(--space-6)", marginTop: -40 }}>
          <Avatar
            name={profile.display_name}
            src={profile.avatar_url ?? undefined}
            size={80}
            verified={profile.is_verified}
            style={{ border: "4px solid var(--surface)", borderRadius: "50%" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginTop: "var(--space-3)", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "var(--fs-h2)", margin: 0 }}>{profile.display_name}</h1>
            {profile.is_verified && <VerifiedBadge type="verified" size="sm" />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-2)", flexWrap: "wrap" }}>
            <Badge tone={profile.role === "sponsor" ? "primary" : "accent"} size="sm">
              {profile.role === "sponsor"
                ? "Sponsor"
                : sponsee
                  ? SPONSEE_TYPE_LABELS[sponsee.type]
                  : "Gesponserter"}
            </Badge>
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
          {sponsor && (
            <p style={{ margin: "var(--space-3) 0 0", fontFamily: "var(--font-display)", fontWeight: 700 }}>
              {sponsor.company_name}
              {sponsor.company_size && (
                <span style={{ color: "var(--text-muted)", fontWeight: 400, fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)" }}>
                  {" "}· {sponsor.company_size} Mitarbeitende
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

      {/* Bio */}
      {profile.bio && (
        <Card padding="lg">
          <h2 style={{ fontSize: "var(--fs-h4)", marginBottom: "var(--space-3)" }}>
            {profile.role === "sponsor" ? "Über das Unternehmen" : "Über mich"}
          </h2>
          <p style={{ margin: 0, color: "var(--text)", lineHeight: "var(--lh-relaxed)", whiteSpace: "pre-line" }}>
            {profile.bio}
          </p>
        </Card>
      )}

      {/* Kennzahlen */}
      <Card padding="lg">
        <div style={{ display: "flex", gap: "var(--space-10)", flexWrap: "wrap" }}>
          {sponsee?.reach_total != null && (
            <StatBlock value={formatNumber(sponsee.reach_total)} label="Reichweite gesamt" />
          )}
          {priceRange && (
            <StatBlock
              value={priceRange}
              label={profile.role === "sponsor" ? "Budget pro Deal" : "Preis pro Deal"}
            />
          )}
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

      {/* Kanäle & Mediakit / Website */}
      {(socialEntries.length > 0 || mediaKitUrl || profile.website) && (
        <Card padding="lg">
          <h2 style={{ fontSize: "var(--fs-h4)", marginBottom: "var(--space-4)" }}>Links & Unterlagen</h2>
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
            {mediaKitUrl && (
              <Button as="a" href={mediaKitUrl} variant="accent" size="sm" rel="noopener noreferrer" target="_blank">
                Mediakit ansehen (PDF)
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
