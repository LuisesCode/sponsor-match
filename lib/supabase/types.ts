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

// Hinweis: `type` statt `interface`, damit die Rows das
// Record<string, unknown>-Constraint von postgrest-js erfüllen.
export type Profile = {
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
};

export type Consent = {
  id: string;
  profile_id: string;
  type: ConsentType;
  version: string;
  granted_at: string;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

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

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        // Anlage erfolgt ausschließlich über den Signup-Trigger;
        // der Typ existiert nur, um das Schema-Constraint zu erfüllen.
        Insert: {
          user_id: string;
          role: ProfileRole;
          display_name: string;
          slug: string;
        };
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
        Update: { revoked_at?: string | null };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: {
      profile_role: ProfileRole;
      region: Region;
      consent_type: ConsentType;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
