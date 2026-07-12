import initSqlJs from "sql.js";
import schemaSql from "./schema.sql?raw";
import { seedDatabase } from "./seed";
import { loadSnapshot, saveSnapshot, clearSnapshot } from "./idb";

/**
 * Flenzko — sql.js-Client (SQLite als WebAssembly, läuft komplett im Browser).
 * Ersetzt Supabase/Postgres: keine RLS, kein Server — der komplette Zustand
 * lebt lokal in dieser einen Browser-Instanz (siehe Plan-Kontext: bewusste
 * Demo-/Portfolio-Einschränkung, kein geteilter Mehrnutzer-Zustand).
 */

type SqlJsStatic = Awaited<ReturnType<typeof initSqlJs>>;
export type SqlDatabase = InstanceType<SqlJsStatic["Database"]>;

let dbInstance: SqlDatabase | null = null;
let initPromise: Promise<SqlDatabase> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(db: SqlDatabase) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    void saveSnapshot(db.export());
  }, 300);
}

async function initialize(): Promise<SqlDatabase> {
  const SQL = await initSqlJs({
    locateFile: (file) => `${import.meta.env.BASE_URL}${file}`,
  });

  const snapshot = await loadSnapshot();
  if (snapshot) {
    return new SQL.Database(snapshot);
  }

  const db = new SQL.Database();
  db.run(schemaSql);
  await seedDatabase(db);
  await saveSnapshot(db.export());
  return db;
}

/** Liefert die (lazily initialisierte) Datenbankverbindung. */
export async function getDb(): Promise<SqlDatabase> {
  if (dbInstance) return dbInstance;
  if (!initPromise) initPromise = initialize();
  dbInstance = await initPromise;
  return dbInstance;
}

/**
 * Nach jeder Schreiboperation aufrufen — persistiert (debounced, 300ms)
 * den aktuellen Binärstand nach IndexedDB.
 */
export function persist(db: SqlDatabase): void {
  scheduleSave(db);
}

/** Demo-Reset: kompletten lokalen Zustand löschen und frisch säen. */
export async function resetDatabase(): Promise<SqlDatabase> {
  await clearSnapshot();
  dbInstance = null;
  initPromise = null;
  return getDb();
}
