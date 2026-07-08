import type { SqlDatabase } from "../client";
import { select } from "../query";
import type { Profile, ProfileRole, SponseeType } from "@/lib/types";
import { REGIONS, SPONSEE_TYPE_LABELS } from "@/lib/validation/onboarding";

const REGION_LABELS = new Map<string, string>(REGIONS.map(([value, label]) => [value, label]));

export type DiscoverFilters = { role: ProfileRole | null; query: string };

export type PublicProfileTeaser = {
  slug: string;
  name: string;
  role: ProfileRole;
  category?: string;
  location?: string;
  avatarSrc?: string;
  verified: boolean;
};

/**
 * Öffentliche Profil-Teaser für /entdecken — nur Basisangaben (kein Bio, keine
 * Preise, kein Matching-Score), da diese Seite bewusst OHNE Login erreichbar
 * ist. Die vollen Profildetails gibt's erst nach Registrierung auf /profil/:slug.
 */
export function getPublicProfileTeasers(db: SqlDatabase, filters: DiscoverFilters): PublicProfileTeaser[] {
  const categories = select<{ id: string; name: string }>(db, "select id, name from categories");
  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

  const params: (string | number | null)[] = [];
  let sql = "select * from profiles where onboarding_completed = 1";
  if (filters.role) {
    sql += " and role = ?";
    params.push(filters.role);
  } else {
    sql += " and role in ('sponsor','sponsee')";
  }
  const profiles = select<Profile>(db, sql + " order by updated_at desc limit 60", params);

  const needle = filters.query.trim().toLowerCase();
  const results: PublicProfileTeaser[] = [];

  for (const p of profiles) {
    let category: string | undefined;
    if (p.role === "sponsor") {
      const row = select<{ industry_id: string | null }>(
        db,
        "select industry_id from sponsor_profiles where profile_id = ?",
        [p.id]
      )[0];
      category = row?.industry_id ? categoryNames.get(row.industry_id) : undefined;
    } else if (p.role === "sponsee") {
      const row = select<{ category_id: string | null; type: SponseeType }>(
        db,
        "select category_id, type from sponsee_profiles where profile_id = ?",
        [p.id]
      )[0];
      category = row?.category_id ? categoryNames.get(row.category_id) : row ? SPONSEE_TYPE_LABELS[row.type] : undefined;
    } else {
      continue;
    }

    const location = p.region ? REGION_LABELS.get(p.region) : undefined;
    if (needle) {
      const haystack = [p.display_name, category, location].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(needle)) continue;
    }

    results.push({
      slug: p.slug,
      name: p.display_name,
      role: p.role,
      category,
      location,
      avatarSrc: p.avatar_url ?? undefined,
      verified: !!p.is_verified,
    });
  }

  return results;
}
