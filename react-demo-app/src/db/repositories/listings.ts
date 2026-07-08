import type { SqlDatabase } from "../client";
import { select, selectOne, exec, newId, nowIso } from "../query";
import type { Listing, ListingDirection, ListingStatus, Region } from "@/lib/types";

export type CreateListingInput = {
  authorProfileId: string;
  direction: ListingDirection;
  title: string;
  description: string;
  categoryId: string | null;
  region: Region | null;
  budgetMin: number | null;
  budgetMax: number | null;
  reachRequired: number | null;
  status: "draft" | "active";
  expiresAt: string | null;
};

export function createListing(db: SqlDatabase, input: CreateListingInput): Listing {
  const id = newId();
  const now = nowIso();
  exec(
    db,
    `insert into listings
      (id, author_profile_id, direction, title, description, category_id, region,
       budget_min, budget_max, reach_required, status, expires_at, created_at, updated_at)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.authorProfileId,
      input.direction,
      input.title,
      input.description,
      input.categoryId,
      input.region,
      input.budgetMin,
      input.budgetMax,
      input.reachRequired,
      input.status,
      input.expiresAt,
      now,
      now,
    ]
  );
  return getListingById(db, id)!;
}

export function getListingById(db: SqlDatabase, id: string): Listing | null {
  return selectOne<Listing>(db, "select * from listings where id = ?", [id]);
}

export function listOwnListings(db: SqlDatabase, authorProfileId: string): Listing[] {
  return select<Listing>(
    db,
    "select * from listings where author_profile_id = ? order by created_at desc",
    [authorProfileId]
  );
}

/** Aktive Marktplatz-Listings (fremde Autoren, nicht abgelaufen). */
export function listMarketListings(db: SqlDatabase, excludeAuthorProfileId: string): Listing[] {
  const now = nowIso();
  return select<Listing>(
    db,
    `select * from listings
     where status = 'active' and author_profile_id != ?
       and (expires_at is null or expires_at > ?)
     order by created_at desc limit 60`,
    [excludeAuthorProfileId, now]
  );
}

export function setListingStatus(db: SqlDatabase, listingId: string, status: ListingStatus): void {
  exec(db, "update listings set status = ?, updated_at = ? where id = ?", [
    status,
    nowIso(),
    listingId,
  ]);
}
