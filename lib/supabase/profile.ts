import { cache } from "react";

import { createClient } from "./server";
import type { Profile } from "./types";

/**
 * Profil des eingeloggten Nutzers (request-weit gecacht).
 * Gibt null zurück, wenn niemand eingeloggt ist oder noch kein Profil existiert.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return profile;
});
