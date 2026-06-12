import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { getCurrentProfile } from "@/lib/supabase/profile";

export const metadata: Metadata = {
  title: "Onboarding — SponsorMatch",
};

/**
 * Platzhalter für den rollenspezifischen Profil-Wizard (M2).
 * proxy.ts leitet alle (app)-Routen hierher, solange
 * onboarding_completed = false ist.
 */
export default async function OnboardingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.onboarding_completed) redirect("/dashboard");

  const roleHint =
    profile.role === "sponsor"
      ? "Hier richtest du gleich dein Unternehmensprofil ein: Branche, Budget und Zielgruppe."
      : "Hier richtest du gleich dein Profil ein: Kategorie, Reichweite und Mediakit.";

  return (
    <div style={{ maxWidth: "var(--container-sm)", margin: "0 auto" }}>
      <span className="sm-eyebrow">Schritt 1 von 1 — bald mehr</span>
      <h1 style={{ fontSize: "var(--fs-h1)", margin: "var(--space-2) 0 var(--space-6)" }}>
        Schön, dass du da bist, {profile.display_name}!
      </h1>
      <Card padding="lg">
        <p style={{ margin: 0, color: "var(--text-muted)" }}>
          Dein Konto ist bestätigt. Der Profil-Wizard entsteht in Meilenstein
          M2 — {roleHint}
        </p>
      </Card>
    </div>
  );
}
