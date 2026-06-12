/**
 * SponsorMatch — Datenbank-Typen (manuell gepflegt).
 * Quelle: supabase/migrations/. Sobald ein Supabase-Projekt verbunden ist,
 * können diese Typen via `supabase gen types typescript` generiert werden.
 */

export type ProfileRole = "sponsor" | "sponsee" | "admin";

export type Region =
  | "baden_wuerttemberg"
  | "bayern"
  | "berlin"
  | "brandenburg"
  | "bremen"
  | "hamburg"
  | "hessen"
  | "mecklenburg_vorpommern"
  | "niedersachsen"
  | "nordrhein_westfalen"
  | "rheinland_pfalz"
  | "saarland"
  | "sachsen"
  | "sachsen_anhalt"
  | "schleswig_holstein"
  | "thueringen"
  | "at"
  | "ch";

export type ConsentType = "terms" | "privacy" | "marketing" | "cookies";

export interface Profile {
  id: string;
  user_id: string;
  role: ProfileRole;
  display_name: string;
  slug: string;
  avatar_url: string | null;
  bio: string | null;
  region: Region | null;
  website: string | null;
  onboarding_completed: boolean;
  is_verified: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Consent {
  id: string;
  profile_id: string;
  type: ConsentType;
  version: string;
  granted_at: string;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Spalten, die der Nutzer an der eigenen Profilzeile ändern darf (vgl. GRANT in Migration 0001). */
export type ProfileUpdate = Partial<
  Pick<
    Profile,
    | "display_name"
    | "slug"
    | "avatar_url"
    | "bio"
    | "region"
    | "website"
    | "onboarding_completed"
  >
>;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: never; // Anlage ausschließlich über den Signup-Trigger
        Update: ProfileUpdate;
        Relationships: [];
      };
      consents: {
        Row: Consent;
        Insert: {
          profile_id: string;
          type: ConsentType;
          version: string;
          granted_at?: string;
          revoked_at?: string | null;
        };
        Update: { revoked_at: string | null };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      profile_role: ProfileRole;
      region: Region;
      consent_type: ConsentType;
    };
    CompositeTypes: Record<string, never>;
  };
}
