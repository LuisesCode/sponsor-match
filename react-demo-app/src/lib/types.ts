/**
 * FLENZKO — Domain-Typen.
 * 1:1 abgeleitet aus dem Datenmodell des Flenzko-Originals
 * (lib/supabase/types.ts, siehe PLAN.md §3), ohne den Supabase/Postgrest-
 * spezifischen `Database`-Wrapper — hier gibt es kein Postgrest, sondern
 * sql.js (SQLite im Browser).
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

export type Profile = {
  id: string;
  role: ProfileRole;
  display_name: string;
  slug: string;
  avatar_url: string | null;
  bio: string | null;
  region: Region | null;
  website: string | null;
  onboarding_completed: boolean;
  is_verified: boolean;
  /** Nur für die lokale Demo-Anmeldung — kein echtes Auth-Backend. */
  password_hash: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export type CategoryKind = "sport" | "industry" | "creator_niche";

export type SponseeType = "athlete" | "club" | "creator";

export type CompanySize = "1-10" | "11-50" | "51-200" | "201-1000" | "1000+";

export type AudienceInfo = {
  age_groups?: string[];
  interests?: string[];
};

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
  commission_pct: number;
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
};

export type DealMilestoneInput = {
  title: string;
  amount: number; // Cent
  due_date?: string | null;
};

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
};

export type PlatformSetting = {
  key: string;
  value: Record<string, unknown>;
};

export type NotificationType =
  | "new_message"
  | "deal_proposed"
  | "deal_countered"
  | "contract_accepted"
  | "deal_status_changed";

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
  created_at: string;
};
