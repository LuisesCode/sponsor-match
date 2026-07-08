import { z } from "zod";

/**
 * Flenzko — Validierung der Profil-bearbeiten-Seite (M3).
 * Rollenfelder nutzen weiterhin die Onboarding-Schemas; hier kommen nur
 * Anzeigename und Avatar-Upload dazu.
 */

export const displayNameSchema = z
  .string("Bitte gib deinen Anzeigenamen an.")
  .trim()
  .min(2, "Der Anzeigename braucht mindestens 2 Zeichen.")
  .max(80, "Der Anzeigename darf höchstens 80 Zeichen haben.");

/** Avatar-Upload: Bilder (PNG/JPEG/WebP) bis 2 MB — der Bucket erzwingt beides zusätzlich. */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export const AVATAR_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

const AVATAR_EXTENSIONS: Record<(typeof AVATAR_MIME_TYPES)[number], string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function validateAvatar(file: File): string | null {
  if (file.size === 0) return null; // kein Upload gewählt
  if (!(AVATAR_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "Der Avatar muss ein Bild sein (PNG, JPG oder WebP).";
  }
  if (file.size > AVATAR_MAX_BYTES) return "Der Avatar darf höchstens 2 MB groß sein.";
  return null;
}

/** Dateiendung zum validierten MIME-Type ("image/png" → "png"). */
export function avatarExtension(mimeType: string): string {
  return AVATAR_EXTENSIONS[mimeType as (typeof AVATAR_MIME_TYPES)[number]] ?? "png";
}
