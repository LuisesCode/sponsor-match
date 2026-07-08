import type { SqlDatabase } from "../client";
import { select, selectOne, exec, newId, nowIso } from "../query";
import { hashPassword, verifyPassword } from "@/auth/password";
import type {
  Profile,
  ProfileRole,
  SponsorProfile,
  SponseeProfile,
  AudienceInfo,
  SocialLinks,
  Region,
  CompanySize,
  SponseeType,
} from "@/lib/types";

/** 1:1 aus public.slugify() der Original-Migration (profiles.sql). */
function slugify(input: string): string {
  const translit: Record<string, string> = {
    ä: "a", ö: "o", ü: "u", ß: "s",
    Ä: "A", Ö: "O", Ü: "U",
    á: "a", à: "a", â: "a", é: "e", è: "e", ê: "e",
    í: "i", ì: "i", î: "i", ó: "o", ò: "o", ô: "o",
    ú: "u", ù: "u", û: "u",
  };
  const transliterated = input.replace(/[äöüßÄÖÜáàâéèêíìîóòôúùû]/g, (c) => translit[c] ?? c);
  return transliterated
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function randomSuffix(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

export function findProfileByEmail(db: SqlDatabase, email: string): Profile | null {
  return selectOne<Profile>(db, "select * from profiles where email = ?", [email.toLowerCase()]);
}

export function getProfileById(db: SqlDatabase, id: string): Profile | null {
  return selectOne<Profile>(db, "select * from profiles where id = ?", [id]);
}

export function getProfileBySlug(db: SqlDatabase, slug: string): Profile | null {
  return selectOne<Profile>(db, "select * from profiles where slug = ?", [slug]);
}

export type RegisterInput = {
  role: ProfileRole;
  displayName: string;
  email: string;
  password: string;
};

/** Registrierung: legt sofort ein bestätigtes Profil an (kein E-Mail-Versand möglich). */
export async function createAccount(db: SqlDatabase, input: RegisterInput): Promise<Profile> {
  const email = input.email.toLowerCase();
  if (findProfileByEmail(db, email)) {
    throw new Error("EMAIL_TAKEN");
  }

  const slug = `${slugify(input.displayName) || "mitglied"}-${randomSuffix()}`;
  const id = newId();
  const now = nowIso();
  const passwordHash = await hashPassword(input.password);

  exec(
    db,
    `insert into profiles
      (id, role, display_name, slug, avatar_url, bio, region, website,
       onboarding_completed, is_verified, password_hash, email, created_at, updated_at)
     values (?, ?, ?, ?, null, null, null, null, 0, 0, ?, ?, ?, ?)`,
    [id, input.role, input.displayName, slug, passwordHash, email, now, now]
  );

  return getProfileById(db, id)!;
}

export async function verifyLogin(
  db: SqlDatabase,
  email: string,
  password: string
): Promise<Profile | null> {
  const profile = findProfileByEmail(db, email);
  if (!profile) return null;
  const ok = await verifyPassword(password, profile.password_hash);
  return ok ? profile : null;
}

export function updateProfileBasics(
  db: SqlDatabase,
  profileId: string,
  patch: { bio: string | null; region: Region; website: string | null }
): void {
  exec(
    db,
    `update profiles set bio = ?, region = ?, website = ?, onboarding_completed = 1, updated_at = ?
     where id = ?`,
    [patch.bio, patch.region, patch.website, nowIso(), profileId]
  );
}

export type SponsorOnboardingData = {
  bio: string | null;
  region: Region;
  website: string | null;
  targetAudience: AudienceInfo;
  companyName: string;
  industryId: string;
  companySize: CompanySize | null;
  budgetMin: number | null;
  budgetMax: number | null;
  vatId: string | null;
};

export function completeSponsorOnboarding(
  db: SqlDatabase,
  profileId: string,
  data: SponsorOnboardingData
): void {
  const existing = selectOne<SponsorProfile>(
    db,
    "select * from sponsor_profiles where profile_id = ?",
    [profileId]
  );
  if (existing) {
    exec(
      db,
      `update sponsor_profiles set company_name = ?, industry_id = ?, company_size = ?,
         budget_min = ?, budget_max = ?, target_audience = ?, vat_id = ? where profile_id = ?`,
      [
        data.companyName,
        data.industryId,
        data.companySize,
        data.budgetMin,
        data.budgetMax,
        JSON.stringify(data.targetAudience),
        data.vatId,
        profileId,
      ]
    );
  } else {
    exec(
      db,
      `insert into sponsor_profiles
        (id, profile_id, company_name, industry_id, company_size, budget_min, budget_max, target_audience, vat_id)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId(),
        profileId,
        data.companyName,
        data.industryId,
        data.companySize,
        data.budgetMin,
        data.budgetMax,
        JSON.stringify(data.targetAudience),
        data.vatId,
      ]
    );
  }
  updateProfileBasics(db, profileId, { bio: data.bio, region: data.region, website: data.website });
}

export type SponseeOnboardingData = {
  bio: string | null;
  region: Region;
  website: string | null;
  audience: AudienceInfo;
  type: SponseeType;
  categoryId: string;
  reachTotal: number | null;
  socialLinks: SocialLinks;
  pastSponsors: string[];
  priceMin: number | null;
  priceMax: number | null;
};

export function completeSponseeOnboarding(
  db: SqlDatabase,
  profileId: string,
  data: SponseeOnboardingData
): void {
  const existing = selectOne<SponseeProfile>(
    db,
    "select * from sponsee_profiles where profile_id = ?",
    [profileId]
  );
  if (existing) {
    exec(
      db,
      `update sponsee_profiles set type = ?, category_id = ?, reach_total = ?, audience = ?,
         social_links = ?, past_sponsors = ?, price_min = ?, price_max = ? where profile_id = ?`,
      [
        data.type,
        data.categoryId,
        data.reachTotal,
        JSON.stringify(data.audience),
        JSON.stringify(data.socialLinks),
        JSON.stringify(data.pastSponsors),
        data.priceMin,
        data.priceMax,
        profileId,
      ]
    );
  } else {
    exec(
      db,
      `insert into sponsee_profiles
        (id, profile_id, type, category_id, reach_total, audience, social_links, media_kit_path, past_sponsors, price_min, price_max)
       values (?, ?, ?, ?, ?, ?, ?, null, ?, ?, ?)`,
      [
        newId(),
        profileId,
        data.type,
        data.categoryId,
        data.reachTotal,
        JSON.stringify(data.audience),
        JSON.stringify(data.socialLinks),
        JSON.stringify(data.pastSponsors),
        data.priceMin,
        data.priceMax,
      ]
    );
  }
  updateProfileBasics(db, profileId, { bio: data.bio, region: data.region, website: data.website });
}

/** sql.js liefert jsonb-Spalten als TEXT zurück — hier zu Objekten geparst. */
function parseSponsorProfile(row: SponsorProfile | null): SponsorProfile | null {
  if (!row) return null;
  return { ...row, target_audience: JSON.parse(row.target_audience as unknown as string) };
}

function parseSponseeProfile(row: SponseeProfile | null): SponseeProfile | null {
  if (!row) return null;
  return {
    ...row,
    audience: JSON.parse(row.audience as unknown as string),
    social_links: JSON.parse(row.social_links as unknown as string),
    past_sponsors: JSON.parse(row.past_sponsors as unknown as string),
  };
}

export function getSponsorProfile(db: SqlDatabase, profileId: string): SponsorProfile | null {
  return parseSponsorProfile(
    selectOne<SponsorProfile>(db, "select * from sponsor_profiles where profile_id = ?", [
      profileId,
    ])
  );
}

export function getSponseeProfile(db: SqlDatabase, profileId: string): SponseeProfile | null {
  return parseSponseeProfile(
    selectOne<SponseeProfile>(db, "select * from sponsee_profiles where profile_id = ?", [
      profileId,
    ])
  );
}

export function listProfilesByRole(db: SqlDatabase, role: ProfileRole): Profile[] {
  return select<Profile>(db, "select * from profiles where role = ? order by display_name", [
    role,
  ]);
}
