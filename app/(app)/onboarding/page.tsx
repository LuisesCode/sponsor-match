import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/supabase/types";

import { OnboardingWizard } from "./OnboardingWizard";

export const metadata: Metadata = {
  title: "Onboarding — SponsorMatch",
};

function toOptions(categories: Category[], kind: Category["kind"]) {
  return categories
    .filter((c) => c.kind === kind)
    .map((c) => ({ value: c.id, label: c.name }));
}

/** Rollenspezifischer Profil-Wizard — Pflicht vor dem ersten Dashboard-Besuch. */
export default async function OnboardingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.onboarding_completed) redirect("/dashboard");
  // Admins entstehen nie über Signup; falls doch eingeloggt, direkt weiter.
  if (profile.role === "admin") redirect("/dashboard");

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  const all = categories ?? [];

  return (
    <div style={{ maxWidth: "var(--container-sm)", margin: "0 auto" }}>
      <span className="sm-eyebrow">
        {profile.role === "sponsor" ? "Sponsor-Profil einrichten" : "Dein Profil einrichten"}
      </span>
      <h1 style={{ fontSize: "var(--fs-h1)", margin: "var(--space-2) 0 var(--space-6)" }}>
        Schön, dass du da bist, {profile.display_name}!
      </h1>
      <OnboardingWizard
        role={profile.role}
        displayName={profile.display_name}
        sportOptions={toOptions(all, "sport")}
        industryOptions={toOptions(all, "industry")}
        creatorNicheOptions={toOptions(all, "creator_niche")}
      />
    </div>
  );
}
