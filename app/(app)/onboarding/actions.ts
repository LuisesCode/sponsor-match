"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import type { AudienceInfo, SocialLinks } from "@/lib/supabase/types";
import {
  sponseeOnboardingSchema,
  sponsorOnboardingSchema,
  validateMediaKit,
} from "@/lib/validation/onboarding";

import type { OnboardingFormState } from "./form-state";

/** Kommagetrennte Eingabe → bereinigte Liste ("Adidas, , Puma" → ["Adidas","Puma"]). */
function splitList(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Schließt das Onboarding ab: legt das Rollenprofil an (Upsert) und
 * aktualisiert das Basisprofil inkl. onboarding_completed.
 */
export async function completeOnboarding(
  _prev: OnboardingFormState,
  formData: FormData
): Promise<OnboardingFormState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.onboarding_completed) redirect("/dashboard");

  const supabase = await createClient();

  if (profile.role === "sponsor") {
    const parsed = sponsorOnboardingSchema.safeParse({
      bio: formData.get("bio"),
      region: formData.get("region"),
      website: formData.get("website"),
      ageGroups: formData.getAll("ageGroups"),
      interests: splitList(formData.get("interests")),
      companyName: formData.get("companyName"),
      industryId: formData.get("industryId"),
      companySize: formData.get("companySize") || null,
      budgetMin: formData.get("budgetMin"),
      budgetMax: formData.get("budgetMax"),
      vatId: formData.get("vatId"),
    });

    if (!parsed.success) {
      return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };
    }

    const d = parsed.data;
    const targetAudience: AudienceInfo = { age_groups: d.ageGroups, interests: d.interests };

    const { error: upsertError } = await supabase.from("sponsor_profiles").upsert(
      {
        profile_id: profile.id,
        company_name: d.companyName,
        industry_id: d.industryId,
        company_size: d.companySize ?? null,
        budget_min: d.budgetMin,
        budget_max: d.budgetMax,
        target_audience: targetAudience,
        vat_id: d.vatId,
      },
      { onConflict: "profile_id" }
    );

    if (upsertError) {
      console.error("Sponsor-Onboarding fehlgeschlagen:", upsertError);
      return {
        status: "error",
        message: "Dein Profil konnte nicht gespeichert werden. Bitte versuch es gleich noch einmal.",
      };
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        bio: d.bio,
        region: d.region as never,
        website: d.website,
        onboarding_completed: true,
      })
      .eq("id", profile.id);

    if (profileError) {
      console.error("Profil-Update fehlgeschlagen:", profileError);
      return {
        status: "error",
        message: "Dein Profil konnte nicht gespeichert werden. Bitte versuch es gleich noch einmal.",
      };
    }

    redirect("/dashboard");
  }

  // ---- Gesponserte:r --------------------------------------------------
  const parsed = sponseeOnboardingSchema.safeParse({
    bio: formData.get("bio"),
    region: formData.get("region"),
    website: formData.get("website"),
    ageGroups: formData.getAll("ageGroups"),
    interests: splitList(formData.get("interests")),
    type: formData.get("type"),
    categoryId: formData.get("categoryId"),
    reachTotal: formData.get("reachTotal"),
    instagram: formData.get("instagram"),
    tiktok: formData.get("tiktok"),
    youtube: formData.get("youtube"),
    pastSponsors: splitList(formData.get("pastSponsors")),
    priceMin: formData.get("priceMin"),
    priceMax: formData.get("priceMax"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const d = parsed.data;

  // Mediakit hochladen (optional, nur PDF ≤ 10 MB; der Bucket erzwingt beides zusätzlich).
  let mediaKitPath: string | null = null;
  const mediaKit = formData.get("mediaKit");
  if (mediaKit instanceof File && mediaKit.size > 0) {
    const fileError = validateMediaKit(mediaKit);
    if (fileError) {
      return { status: "error", fieldErrors: { mediaKit: [fileError] } };
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    mediaKitPath = `${user.id}/mediakit.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("media-kits")
      .upload(mediaKitPath, mediaKit, { upsert: true, contentType: "application/pdf" });

    if (uploadError) {
      console.error("Mediakit-Upload fehlgeschlagen:", uploadError);
      return {
        status: "error",
        fieldErrors: { mediaKit: ["Der Upload hat nicht geklappt. Bitte versuch es noch einmal."] },
      };
    }
  }

  const audience: AudienceInfo = { age_groups: d.ageGroups, interests: d.interests };
  const socialLinks: SocialLinks = {
    ...(d.instagram ? { instagram: d.instagram } : {}),
    ...(d.tiktok ? { tiktok: d.tiktok } : {}),
    ...(d.youtube ? { youtube: d.youtube } : {}),
  };

  const { error: upsertError } = await supabase.from("sponsee_profiles").upsert(
    {
      profile_id: profile.id,
      type: d.type,
      category_id: d.categoryId,
      reach_total: d.reachTotal,
      audience,
      social_links: socialLinks,
      // Vorhandenes Mediakit nicht überschreiben, wenn diesmal keins hochgeladen wurde.
      ...(mediaKitPath ? { media_kit_path: mediaKitPath } : {}),
      past_sponsors: d.pastSponsors,
      price_min: d.priceMin,
      price_max: d.priceMax,
    },
    { onConflict: "profile_id" }
  );

  if (upsertError) {
    console.error("Sponsee-Onboarding fehlgeschlagen:", upsertError);
    return {
      status: "error",
      message: "Dein Profil konnte nicht gespeichert werden. Bitte versuch es gleich noch einmal.",
    };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      bio: d.bio,
      region: d.region as never,
      website: d.website,
      onboarding_completed: true,
    })
    .eq("id", profile.id);

  if (profileError) {
    console.error("Profil-Update fehlgeschlagen:", profileError);
    return {
      status: "error",
      message: "Dein Profil konnte nicht gespeichert werden. Bitte versuch es gleich noch einmal.",
    };
  }

  redirect("/dashboard");
}
