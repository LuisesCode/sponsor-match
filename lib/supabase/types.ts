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

export type ListingDirection = "seeking_sponsor" | "offering_sponsorship";

export type ListingStatus = "draft" | "active" | "paused" | "closed";

export type Listing = {
  id: string;
  author_profile_id: string;
  direction: ListingDirection;
  title: string;
  description: string;
  category_id: string | null;
  region: Region | null;
  budget_min: number | null; // Cent
  budget_max: number | null; // Cent
  reach_required: number | null;
  status: ListingStatus;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ListingInsert = Omit<Listing, "id" | "created_at" | "updated_at" | "status"> & {
  status?: ListingStatus;
};

export type ListingUpdate = Partial<
  Pick<
    Listing,
    | "title"
    | "description"
    | "category_id"
    | "region"
    | "budget_min"
    | "budget_max"
    | "reach_required"
    | "status"
    | "expires_at"
  >
>;

export type Conversation = {
  id: string;
  listing_id: string | null;
  sponsor_profile_id: string;
  sponsee_profile_id: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_profile_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DealStatus =
  | "draft"
  | "offered"
  | "negotiating"
  | "agreed"
  | "funded"
  | "in_progress"
  | "completed"
  | "declined"
  | "cancelled"
  | "disputed";

export type MilestoneStatus = "pending" | "submitted" | "approved" | "paid" | "disputed";

export type Deal = {
  id: string;
  conversation_id: string;
  listing_id: string | null;
  sponsor_profile_id: string;
  sponsee_profile_id: string;
  proposed_by_profile_id: string;
  title: string;
  description: string;
  amount_total: number; // Cent
  currency: "eur";
  commission_pct: number; // beim Anlegen eingefroren
  commission_amount: number; // Cent
  status: DealStatus;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type DealMilestone = {
  id: string;
  deal_id: string;
  position: number;
  title: string;
  due_date: string | null;
  amount: number; // Cent
  status: MilestoneStatus;
  proof_url: string | null;
  created_at: string;
  updated_at: string;
};

/** Meilenstein-Eingabe für create_deal/counter_deal_offer (jsonb-Parameter). */
export type DealMilestoneInput = {
  title: string;
  amount: number; // Cent
  due_date?: string | null;
};

/** Strukturierter Vertrags-Snapshot (contracts.content, von build_contract_content befüllt). */
export type ContractContent = {
  template_version: string;
  created_at: string;
  deal: {
    id: string;
    title: string;
    description: string;
    amount_total: number;
    currency: string;
    commission_pct: number;
    commission_amount: number;
    payout_amount: number;
    listing_id: string | null;
  };
  sponsor: { profile_id: string; display_name: string; company_name: string | null };
  sponsee: { profile_id: string; display_name: string };
  milestones: { position: number; title: string; amount: number; due_date: string | null }[];
};

export type Contract = {
  id: string;
  deal_id: string;
  template_version: string;
  content: ContractContent;
  sponsor_accepted_at: string | null;
  sponsee_accepted_at: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
};

export type PlatformSetting = {
  key: string;
  value: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type NotificationType =
  | "new_message"
  | "deal_proposed"
  | "deal_countered"
  | "contract_accepted"
  | "deal_status_changed";

/** Payload einer Notification (jsonb, von DB-Trigger bzw. Deal-Funktionen befüllt). */
export type NotificationPayload = {
  conversation_id?: string;
  message_id?: string;
  sender_profile_id?: string;
  deal_id?: string;
  actor_profile_id?: string;
  old_status?: DealStatus;
  new_status?: DealStatus;
};

export type Notification = {
  id: string;
  profile_id: string;
  type: NotificationType;
  payload: NotificationPayload;
  read_at: string | null;
  emailed_at: string | null;
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
      listings: {
        Row: Listing;
        Insert: ListingInsert;
        Update: ListingUpdate;
        Relationships: [];
      };
      conversations: {
        Row: Conversation;
        Insert: {
          listing_id?: string | null;
          sponsor_profile_id: string;
          sponsee_profile_id: string;
        };
        // Kein Update-Grant für authenticated; updated_at pflegt der Trigger.
        Update: Record<PropertyKey, never>;
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: {
          conversation_id: string;
          sender_profile_id: string;
          body: string;
        };
        Update: { read_at?: string | null };
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        // Insert nur über den DB-Trigger (Security Definer).
        Insert: never;
        Update: { read_at?: string | null };
        Relationships: [];
      };
      deals: {
        Row: Deal;
        // Schreibzugriffe nur über die Security-Definer-Funktionen (M5).
        Insert: never;
        Update: never;
        Relationships: [];
      };
      deal_milestones: {
        Row: DealMilestone;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      contracts: {
        Row: Contract;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      platform_settings: {
        Row: PlatformSetting;
        // Pflege nur durch Admin (RLS).
        Insert: { key: string; value: Record<string, unknown> };
        Update: { value?: Record<string, unknown> };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      owns_profile: { Args: { p_profile_id: string }; Returns: boolean };
      create_deal: {
        Args: {
          p_conversation_id: string;
          p_title: string;
          p_description: string;
          p_amount_total: number;
          p_milestones: DealMilestoneInput[];
        };
        Returns: string;
      };
      counter_deal_offer: {
        Args: {
          p_deal_id: string;
          p_title: string;
          p_description: string;
          p_amount_total: number;
          p_milestones: DealMilestoneInput[];
        };
        Returns: null;
      };
      accept_contract: { Args: { p_deal_id: string }; Returns: null };
      advance_deal_status: {
        Args: { p_deal_id: string; p_new_status: DealStatus; p_reason?: string | null };
        Returns: null;
      };
    };
    Enums: {
      profile_role: ProfileRole;
      region: Region;
      consent_type: ConsentType;
      category_kind: CategoryKind;
      sponsee_type: SponseeType;
      company_size: CompanySize;
      listing_direction: ListingDirection;
      listing_status: ListingStatus;
      deal_status: DealStatus;
      milestone_status: MilestoneStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
