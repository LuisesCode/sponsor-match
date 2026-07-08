import type { SqlDatabase } from "../client";
import { select } from "../query";
import type { Category, CategoryKind } from "@/lib/types";

export function listCategories(db: SqlDatabase, kind?: CategoryKind): Category[] {
  if (kind) {
    return select<Category>(db, "select * from categories where kind = ? order by name", [kind]);
  }
  return select<Category>(db, "select * from categories order by kind, name");
}
