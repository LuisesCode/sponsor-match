import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/supabase/types";

import { ProfileEditForm, type ProfileEditDefaults } from "./ProfileEditForm";

export const metadata: Metadata = {
  title: "Profil bearbeiten — SponsorMatch",
};

const EURO_INPUT = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 });

/** Cent → Eingabe-String in Euro ("125050" → "1.250,5"); null → "". */
function centsToInput(cents: number | null): string {
  return cents == null ? "" : EURO_INPUT.format(cents / 100);
}

function toOptions(categories: Category[], kind: Category["kind"]) {
  return categories.filter((c) => c.kind === kind).map((c) => ({ value: c.id, label: c.name }));
}

/** Profilpflege: Basisdaten, Avatar, Rollenfelder, Zielgruppe. */
export default async function ProfileEditPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.onboarding_completed) redirect("/onboarding");

  const supabase = await createClient();
  const [{ data: categories }, { data: sponsor }, { data: sponsee }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    profile.role === "sponsor"
      ? supabase.from("sponsor_profiles").select("*").eq("profile_id", profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
    profile.role === "sponsee"
      ? supabase.from("sponsee_profiles").select("*").eq("profile_id", profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const all = categories ?? [];
  const audience = sponsor?.target_audience ?? sponsee?.audience ?? {};

  const defaults: ProfileEditDefaults = {
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    bio: profile.bio ?? "",
    region: profile.region ?? "",
    website: profile.website ?? "",
    ageGroups: audience.age_groups ?? [],
    interests: (audience.interests ?? []).join(", "),
    // Sponsor
    companyName: sponsor?.company_name,
    industryId: sponsor?.industry_id ?? undefined,
    companySize: sponsor?.company_size ?? undefined,
    budgetMin: centsToInput(sponsor?.budget_min ?? null),
    budgetMax: centsToInput(sponsor?.budget_max ?? null),
    vatId: sponsor?.vat_id ?? undefined,
    // Sponsee
    type: sponsee?.type,
    categoryId: sponsee?.category_id ?? undefined,
    reachTotal: sponsee?.reach_total != null ? String(sponsee.reach_total) : undefined,
    instagram: sponsee?.social_links.instagram,
    tiktok: sponsee?.social_links.tiktok,
    youtube: sponsee?.social_links.youtube,
    pastSponsors: (sponsee?.past_sponsors ?? []).join(", "),
    priceMin: centsToInput(sponsee?.price_min ?? null),
    priceMax: centsToInput(sponsee?.price_max ?? null),
    hasMediaKit: Boolean(sponsee?.media_kit_path),
  };

  return (
    <div style={{ maxWidth: "var(--container-sm)", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap", marginBottom: "var(--space-6)" }}>
        <div>
          <span className="sm-eyebrow">Einstellungen</span>
          <h1 style={{ fontSize: "var(--fs-h1)", margin: "var(--space-2) 0 0" }}>Profil bearbeiten</h1>
        </div>
        <Link
          href={`/profil/${profile.slug}`}
          style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--primary)", textDecoration: "none" }}
        >
          Öffentliches Profil ansehen →
        </Link>
      </div>
      <ProfileEditForm
        role={profile.role}
        defaults={defaults}
        sportOptions={toOptions(all, "sport")}
        industryOptions={toOptions(all, "industry")}
        creatorNicheOptions={toOptions(all, "creator_niche")}
      />
    </div>
  );
}
