"use server";

import { revalidatePath } from "next/cache";
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
import { avatarExtension, displayNameSchema, validateAvatar } from "@/lib/validation/profile";

import type { ProfileEditFormState } from "./form-state";

/** Kommagetrennte Eingabe → bereinigte Liste (wie im Onboarding). */
function splitList(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Speichert Basisprofil (inkl. Avatar-Upload in den avatars-Bucket) und
 * Rollenprofil. Validierung teilt sich die Schemas mit dem Onboarding.
 */
export async function updateProfile(
  _prev: ProfileEditFormState,
  formData: FormData
): Promise<ProfileEditFormState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.onboarding_completed) redirect("/onboarding");

  const supabase = await createClient();

  // ---- Anzeigename ----------------------------------------------------
  const displayNameParsed = displayNameSchema.safeParse(formData.get("displayName"));
  if (!displayNameParsed.success) {
    return {
      status: "error",
      fieldErrors: { displayName: displayNameParsed.error.issues.map((i) => i.message) },
    };
  }

  // ---- Avatar-Upload (optional, Bilder ≤ 2 MB) --------------------------
  let avatarUrl: string | null = null;
  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    const fileError = validateAvatar(avatar);
    if (fileError) {
      return { status: "error", fieldErrors: { avatar: [fileError] } };
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Pfadkonvention des Buckets: <user_id>/… — Besitzer schreibt nur dort.
    // Eindeutiger Dateiname statt Upsert: der Upsert-Pfad der Storage-API
    // braucht eine SELECT-Policy (ON CONFLICT), ein reiner Insert nicht.
    const fileName = `avatar-${Date.now()}.${avatarExtension(avatar.type)}`;
    const path = `${user.id}/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatar, { contentType: avatar.type });

    if (uploadError) {
      console.error("Avatar-Upload fehlgeschlagen:", uploadError);
      return {
        status: "error",
        fieldErrors: { avatar: ["Der Upload hat nicht geklappt. Bitte versuch es noch einmal."] },
      };
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    avatarUrl = data.publicUrl;

    // Alte Avatar-Dateien aufräumen — Best-Effort: braucht die
    // avatars_owner_select-Policy; solange sie fehlt, bleibt Altbestand liegen.
    const { data: existing } = await supabase.storage.from("avatars").list(user.id);
    const stale = (existing ?? [])
      .filter((f) => f.name.startsWith("avatar-") && f.name !== fileName)
      .map((f) => `${user.id}/${f.name}`);
    if (stale.length > 0) {
      await supabase.storage.from("avatars").remove(stale);
    }
  }

  // ---- Rollenfelder (gleiche Schemas wie im Onboarding) -----------------
  const base = {
    bio: formData.get("bio"),
    region: formData.get("region"),
    website: formData.get("website"),
    ageGroups: formData.getAll("ageGroups"),
    interests: splitList(formData.get("interests")),
  };

  let region: string;
  let bio: string | null;
  let website: string | null;

  if (profile.role === "sponsor") {
    const parsed = sponsorOnboardingSchema.safeParse({
      ...base,
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
    ({ region } = d);
    ({ bio, website } = d);

    const targetAudience: AudienceInfo = { age_groups: d.ageGroups, interests: d.interests };
    const { error } = await supabase.from("sponsor_profiles").upsert(
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
    if (error) {
      console.error("Sponsor-Profil speichern fehlgeschlagen:", error);
      return {
        status: "error",
        message: "Dein Profil konnte nicht gespeichert werden. Bitte versuch es gleich noch einmal.",
      };
    }
  } else if (profile.role === "sponsee") {
    const parsed = sponseeOnboardingSchema.safeParse({
      ...base,
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
    ({ region } = d);
    ({ bio, website } = d);

    // Mediakit optional erneuern (vorhandenes bleibt sonst erhalten).
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

    const { error } = await supabase.from("sponsee_profiles").upsert(
      {
        profile_id: profile.id,
        type: d.type,
        category_id: d.categoryId,
        reach_total: d.reachTotal,
        audience,
        social_links: socialLinks,
        ...(mediaKitPath ? { media_kit_path: mediaKitPath } : {}),
        past_sponsors: d.pastSponsors,
        price_min: d.priceMin,
        price_max: d.priceMax,
      },
      { onConflict: "profile_id" }
    );
    if (error) {
      console.error("Sponsee-Profil speichern fehlgeschlagen:", error);
      return {
        status: "error",
        message: "Dein Profil konnte nicht gespeichert werden. Bitte versuch es gleich noch einmal.",
      };
    }
  } else {
    // Admin: nur Basisfelder ohne Rollenprofil.
    const adminBase = z
      .object({
        bio: z.string().trim().max(2000).optional().transform((v) => (v ? v : null)),
        region: z.string().min(1, "Bitte wähle deine Region."),
        website: z
          .union([z.literal(""), z.url()])
          .optional()
          .transform((v) => (v ? v : null)),
      })
      .safeParse({ bio: base.bio, region: base.region, website: base.website });
    if (!adminBase.success) {
      return { status: "error", fieldErrors: z.flattenError(adminBase.error).fieldErrors };
    }
    ({ region } = adminBase.data);
    ({ bio, website } = adminBase.data);
  }

  // ---- Basisprofil ------------------------------------------------------
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      display_name: displayNameParsed.data,
      bio,
      region: region as never,
      website,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq("id", profile.id);

  if (profileError) {
    console.error("Profil-Update fehlgeschlagen:", profileError);
    return {
      status: "error",
      message: "Dein Profil konnte nicht gespeichert werden. Bitte versuch es gleich noch einmal.",
    };
  }

  revalidatePath("/profil/bearbeiten");
  revalidatePath(`/profil/${profile.slug}`);
  return { status: "success" };
}
