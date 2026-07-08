import { openDB, type IDBPDatabase } from "idb";

/**
 * Persistenz-Schicht für die sql.js-Datenbank: der komplette SQLite-Binärstand
 * wird als einziger Blob in IndexedDB abgelegt (robuster/größer als
 * localStorage). Es gibt keinen Server — die Daten leben ausschließlich im
 * Browser dieser einen Person.
 */

const DB_NAME = "flenzko";
const DB_VERSION = 1;
const STORE = "sqlite";
const KEY = "snapshot";

let dbPromise: Promise<IDBPDatabase> | null = null;

function openIdb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore(STORE);
      },
    });
  }
  return dbPromise;
}

export async function loadSnapshot(): Promise<Uint8Array | null> {
  const db = await openIdb();
  const data = await db.get(STORE, KEY);
  return (data as Uint8Array | undefined) ?? null;
}

export async function saveSnapshot(bytes: Uint8Array): Promise<void> {
  const db = await openIdb();
  await db.put(STORE, bytes, KEY);
}

export async function clearSnapshot(): Promise<void> {
  const db = await openIdb();
  await db.delete(STORE, KEY);
}
