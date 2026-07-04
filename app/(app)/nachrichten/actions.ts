"use server";

import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { startConversationSchema } from "@/lib/validation/message";

import type { StartConversationFormState } from "./form-state";

const GENERIC_ERROR =
  "Die Konversation konnte nicht gestartet werden. Bitte versuch es gleich noch einmal.";

/**
 * Startet eine Konversation aus dem Kontakt-CTA (Listing- oder Profilseite).
 * Existiert für das Paar+Listing bereits eine, wird sie wiederverwendet
 * (unique conversations_pair_listing_key) — danach Redirect in den Chat.
 */
export async function startConversation(
  _prev: StartConversationFormState,
  formData: FormData
): Promise<StartConversationFormState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.onboarding_completed) redirect("/onboarding");

  const parsed = startConversationSchema.safeParse({
    counterpartProfileId: formData.get("counterpartProfileId"),
    listingId: formData.get("listingId") ?? "",
  });
  if (!parsed.success) {
    return { status: "error", message: GENERIC_ERROR };
  }
  const { counterpartProfileId, listingId } = parsed.data;

  const supabase = await createClient();
  const { data: counterpart } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", counterpartProfileId)
    .is("deleted_at", null)
    .maybeSingle();

  // Konversationen gibt es nur zwischen einem Sponsor und einem Gesponserten.
  const rolesMatch =
    counterpart &&
    ((profile.role === "sponsor" && counterpart.role === "sponsee") ||
      (profile.role === "sponsee" && counterpart.role === "sponsor"));
  if (!counterpart || !rolesMatch) {
    return {
      status: "error",
      message: "Dieses Profil kannst du nicht kontaktieren.",
    };
  }

  const sponsorProfileId = profile.role === "sponsor" ? profile.id : counterpart.id;
  const sponseeProfileId = profile.role === "sponsee" ? profile.id : counterpart.id;

  const existingQuery = supabase
    .from("conversations")
    .select("id")
    .eq("sponsor_profile_id", sponsorProfileId)
    .eq("sponsee_profile_id", sponseeProfileId);
  const { data: existing } = await (listingId
    ? existingQuery.eq("listing_id", listingId)
    : existingQuery.is("listing_id", null)
  ).maybeSingle();

  if (existing) redirect(`/nachrichten/${existing.id}`);

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({
      listing_id: listingId,
      sponsor_profile_id: sponsorProfileId,
      sponsee_profile_id: sponseeProfileId,
    })
    .select("id")
    .single();

  if (error || !created) {
    // 23505: Race — parallel angelegte Konversation wiederverwenden.
    if (error?.code === "23505") {
      const retryQuery = supabase
        .from("conversations")
        .select("id")
        .eq("sponsor_profile_id", sponsorProfileId)
        .eq("sponsee_profile_id", sponseeProfileId);
      const { data: raced } = await (listingId
        ? retryQuery.eq("listing_id", listingId)
        : retryQuery.is("listing_id", null)
      ).maybeSingle();
      if (raced) redirect(`/nachrichten/${raced.id}`);
    }
    console.error("Konversation starten fehlgeschlagen:", error);
    return { status: "error", message: GENERIC_ERROR };
  }

  redirect(`/nachrichten/${created.id}`);
}
