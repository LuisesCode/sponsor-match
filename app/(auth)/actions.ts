"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  CONSENT_VERSIONS,
  loginSchema,
  registerSchema,
  sanitizeNextPath,
} from "@/lib/validation/auth";

import type { AuthFormState } from "./form-state";

async function requestOrigin(): Promise<string> {
  const headerStore = await headers();
  return (
    headerStore.get("origin") ??
    `https://${headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000"}`
  );
}

export async function register(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    role: formData.get("role"),
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    acceptTerms: formData.get("acceptTerms") === "on",
  });

  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { role, displayName, email, password } = parsed.data;
  const supabase = await createClient();
  const origin = await requestOrigin();

  // Rolle, Anzeigename und Consent-Versionen wandern in die user_metadata;
  // der DB-Trigger handle_new_user() legt daraus Profil + Consents an.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
      data: {
        role,
        display_name: displayName,
        terms_version: CONSENT_VERSIONS.terms,
        privacy_version: CONSENT_VERSIONS.privacy,
      },
    },
  });

  if (error) {
    if (error.code === "weak_password") {
      return {
        status: "error",
        fieldErrors: { password: ["Das Passwort ist zu schwach."] },
      };
    }
    if (error.code === "user_already_exists") {
      return {
        status: "error",
        message:
          "Mit dieser E-Mail-Adresse existiert bereits ein Konto. Melde dich an oder setze dein Passwort zurück.",
      };
    }
    console.error("Registrierung fehlgeschlagen:", error);
    return {
      status: "error",
      message:
        "Die Registrierung hat nicht geklappt. Bitte versuch es gleich noch einmal.",
    };
  }

  return { status: "success", email };
}

export async function login(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        status: "error",
        message:
          "Deine E-Mail-Adresse ist noch nicht bestätigt. Bitte klick auf den Link in der Bestätigungs-Mail.",
      };
    }
    return {
      status: "error",
      message: "E-Mail-Adresse oder Passwort ist nicht korrekt.",
    };
  }

  redirect(sanitizeNextPath(formData.get("next"), "/dashboard"));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
