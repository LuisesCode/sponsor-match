import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { getCurrentProfile } from "@/lib/supabase/profile";

export const metadata: Metadata = {
  title: "Dashboard — SponsorMatch",
};

/** Platzhalter-Dashboard; rollenspezifische KPIs folgen in M8. */
export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div>
      <span className="sm-eyebrow">Dashboard</span>
      <h1 style={{ fontSize: "var(--fs-h1)", margin: "var(--space-2) 0 var(--space-6)" }}>
        Hallo, {profile.display_name}!
      </h1>
      <Card padding="lg">
        <p style={{ margin: 0, color: "var(--text-muted)" }}>
          {profile.role === "sponsor"
            ? "Hier findest du bald passende Talente, offene Anfragen und deine laufenden Deals."
            : "Hier findest du bald passende Sponsoren, offene Anfragen und deine laufenden Deals."}
        </p>
      </Card>
    </div>
  );
}
