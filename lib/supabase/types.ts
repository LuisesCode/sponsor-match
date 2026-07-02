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

export type CategoryKind = "sport" | "industry" | "creator_niche";

export type SponseeType = "athlete" | "club" | "creator";

export type CompanySize = "1-10" | "11-50" | "51-200" | "201-1000" | "1000+";

/** Zielgruppen-/Publikums-Angaben (jsonb) — bewusst schlank für M2/M3. */
export type AudienceInfo = {
  age_groups?: string[];
  interests?: string[];
};

/** Social-Links eines Gesponserten (jsonb). */
export type SocialLinks = {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  twitch?: string;
  website?: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  kind: CategoryKind;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
};

export type SponsorProfile = {
  id: string;
  profile_id: string;
  company_name: string;
  industry_id: string | null;
  company_size: CompanySize | null;
  budget_min: number | null; // Cent
  budget_max: number | null; // Cent
  target_audience: AudienceInfo;
  vat_id: string | null;
  created_at: string;
  updated_at: string;
};

export type SponseeProfile = {
  id: string;
  profile_id: string;
  type: SponseeType;
  category_id: string | null;
  reach_total: number | null;
  audience: AudienceInfo;
  social_links: SocialLinks;
  media_kit_path: string | null;
  past_sponsors: string[];
  price_min: number | null; // Cent
  price_max: number | null; // Cent
  created_at: string;
  updated_at: string;
};

export type SponsorProfileUpsert = Omit<SponsorProfile, "id" | "created_at" | "updated_at">;
/** media_kit_path ist optional: fehlt es im Upsert, bleibt ein vorhandenes Mediakit erhalten. */
export type SponseeProfileUpsert = Omit<
  SponseeProfile,
  "id" | "created_at" | "updated_at" | "media_kit_path"
> & { media_kit_path?: string | null };

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
      categories: {
        Row: Category;
        // Pflege nur durch Admin (RLS); Seed via Migration.
        Insert: { name: string; slug: string; kind: CategoryKind; parent_id?: string | null };
        Update: Partial<Pick<Category, "name" | "slug" | "kind" | "parent_id">>;
        Relationships: [];
      };
      sponsor_profiles: {
        Row: SponsorProfile;
        Insert: SponsorProfileUpsert;
        Update: Partial<SponsorProfileUpsert>;
        Relationships: [];
      };
      sponsee_profiles: {
        Row: SponseeProfile;
        Insert: SponseeProfileUpsert;
        Update: Partial<SponseeProfileUpsert>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      owns_profile: { Args: { p_profile_id: string }; Returns: boolean };
    };
    Enums: {
      profile_role: ProfileRole;
      region: Region;
      consent_type: ConsentType;
      category_kind: CategoryKind;
      sponsee_type: SponseeType;
      company_size: CompanySize;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
