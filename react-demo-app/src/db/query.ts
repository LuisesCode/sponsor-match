import type { SqlDatabase } from "./client";
import { persist } from "./client";

/** sql.js liefert Zeilen als {columns, values}[] — hier zu Objekten gemappt. */
export function select<T extends Record<string, unknown>>(
  db: SqlDatabase,
  sql: string,
  params: (string | number | null)[] = []
): T[] {
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const rows: T[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as T);
    }
    return rows;
  } finally {
    stmt.free();
  }
}

export function selectOne<T extends Record<string, unknown>>(
  db: SqlDatabase,
  sql: string,
  params: (string | number | null)[] = []
): T | null {
  const rows = select<T>(db, sql, params);
  return rows[0] ?? null;
}

/** INSERT/UPDATE/DELETE ausführen und den neuen Stand debounced persistieren. */
export function exec(db: SqlDatabase, sql: string, params: (string | number | null)[] = []): void {
  db.run(sql, params);
  persist(db);
}

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
