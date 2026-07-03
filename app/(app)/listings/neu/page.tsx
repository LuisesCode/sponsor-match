import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";

import { ListingForm } from "./ListingForm";

export const metadata: Metadata = {
  title: "Neues Listing — SponsorMatch",
};

/** Neues Listing — die direction ergibt sich aus der Rolle. */
export default async function NewListingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.onboarding_completed) redirect("/onboarding");
  if (profile.role === "admin") redirect("/listings");

  const supabase = await createClient();
  // Sponsoring-Gegenstand ist immer Sport bzw. Creator-Nische — Branchen
  // beschreiben nur die Sponsoren selbst.
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, kind")
    .in("kind", ["sport", "creator_niche"])
    .order("name");

  const categoryOptions = (categories ?? []).map((c) => ({
    value: c.id,
    label: c.kind === "creator_niche" ? `Creator: ${c.name}` : c.name,
  }));

  return (
    <div style={{ maxWidth: "var(--container-sm)", margin: "0 auto" }}>
      <span className="sm-eyebrow">Marktplatz</span>
      <h1 style={{ fontSize: "var(--fs-h1)", margin: "var(--space-2) 0 var(--space-6)" }}>
        Neues Listing
      </h1>
      <ListingForm role={profile.role} categoryOptions={categoryOptions} />
    </div>
  );
}
