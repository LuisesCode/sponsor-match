/**
 * Flenzko — Passwort-Hashing für die lokale Demo-Anmeldung.
 * Kein echtes Auth-Backend: SHA-256 + zufälliges Salt via Web Crypto,
 * "gut genug" für eine Browser-lokale Demo (siehe Plan "Nicht im Scope":
 * echte Auth-Sicherheit ist ohne Server nicht sinnvoll herstellbar).
 */

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(digest);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = bufferToHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  const hash = await sha256Hex(`${salt}:${password}`);
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = await sha256Hex(`${salt}:${password}`);
  return candidate === hash;
}
