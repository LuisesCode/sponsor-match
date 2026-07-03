"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import type { ListingDirection, Region } from "@/lib/supabase/types";
import { listingSchema, listingStatusSchema } from "@/lib/validation/listing";

import type { ListingFormState } from "./form-state";

/** Legt ein Listing an; die direction ergibt sich aus der Rolle des Autors. */
export async function createListing(
  _prev: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.onboarding_completed) redirect("/onboarding");
  if (profile.role === "admin") redirect("/listings");

  const parsed = listingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    region: formData.get("region"),
    budgetMin: formData.get("budgetMin"),
    budgetMax: formData.get("budgetMax"),
    reachRequired: formData.get("reachRequired"),
    expiresAt: formData.get("expiresAt"),
    status: formData.get("status") ?? "active",
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const d = parsed.data;
  const direction: ListingDirection =
    profile.role === "sponsee" ? "seeking_sponsor" : "offering_sponsorship";

  const supabase = await createClient();
  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      author_profile_id: profile.id,
      direction,
      title: d.title,
      description: d.description,
      category_id: d.categoryId,
      region: d.region as Region | null,
      budget_min: d.budgetMin,
      budget_max: d.budgetMax,
      reach_required: d.reachRequired,
      status: d.status,
      expires_at: d.expiresAt ? new Date(d.expiresAt + "T23:59:59").toISOString() : null,
    })
    .select("id")
    .single();

  if (error || !listing) {
    console.error("Listing anlegen fehlgeschlagen:", error);
    return {
      status: "error",
      message: "Dein Listing konnte nicht gespeichert werden. Bitte versuch es gleich noch einmal.",
    };
  }

  revalidatePath("/listings");
  redirect(`/listings/${listing.id}`);
}

/** Statuswechsel (aktiv/pausiert/geschlossen) für eigene Listings. */
export async function setListingStatus(formData: FormData): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const parsed = listingStatusSchema.safeParse({
    listingId: formData.get("listingId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  // RLS stellt sicher, dass nur eigene Listings geändert werden können.
  const { error } = await supabase
    .from("listings")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.listingId);

  if (error) {
    console.error("Status-Wechsel fehlgeschlagen:", error);
    return;
  }

  revalidatePath("/listings");
  revalidatePath(`/listings/${parsed.data.listingId}`);
}
