import type { Database } from "sql.js";

/**
 * Flenzko — Referenzdaten (Taxonomie + Plattform-Einstellungen).
 * Kategorien 1:1 aus dem SponsorMatch-Original übernommen (PLAN.md/M2-Migration,
 * 37 Einträge: Sport/Branchen/Creator-Nischen) — reine Taxonomie, markenneutral.
 * Demo-Profile/Listings/Deals kommen in Phase 6 hinzu (FLENZKO-Namen).
 */

const CATEGORIES: { name: string; slug: string; kind: "sport" | "industry" | "creator_niche" }[] = [
  // Sportarten (für Sportler & Vereine)
  { name: "Fußball", slug: "fussball", kind: "sport" },
  { name: "Basketball", slug: "basketball", kind: "sport" },
  { name: "Handball", slug: "handball", kind: "sport" },
  { name: "Volleyball", slug: "volleyball", kind: "sport" },
  { name: "Eishockey", slug: "eishockey", kind: "sport" },
  { name: "Tennis", slug: "tennis", kind: "sport" },
  { name: "Laufen & Leichtathletik", slug: "laufen-leichtathletik", kind: "sport" },
  { name: "Radsport", slug: "radsport", kind: "sport" },
  { name: "Wintersport", slug: "wintersport", kind: "sport" },
  { name: "Kampfsport", slug: "kampfsport", kind: "sport" },
  { name: "Fitness & Kraftsport", slug: "fitness-kraftsport", kind: "sport" },
  { name: "Schwimmen", slug: "schwimmen", kind: "sport" },
  { name: "Motorsport", slug: "motorsport", kind: "sport" },
  { name: "E-Sports", slug: "esports", kind: "sport" },
  { name: "Sonstiger Sport", slug: "sonstiger-sport", kind: "sport" },
  // Branchen (für Sponsoren)
  { name: "Sportartikel & Ausrüstung", slug: "sportartikel", kind: "industry" },
  { name: "Ernährung & Getränke", slug: "ernaehrung-getraenke", kind: "industry" },
  { name: "Mode & Lifestyle", slug: "mode-lifestyle", kind: "industry" },
  { name: "Finanzen & Versicherung", slug: "finanzen-versicherung", kind: "industry" },
  { name: "Automobil & Mobilität", slug: "automobil-mobilitaet", kind: "industry" },
  { name: "Technologie & Software", slug: "technologie-software", kind: "industry" },
  { name: "Gesundheit & Pharma", slug: "gesundheit-pharma", kind: "industry" },
  { name: "Energie & Bau", slug: "energie-bau", kind: "industry" },
  { name: "Handel & E-Commerce", slug: "handel-ecommerce", kind: "industry" },
  { name: "Gastronomie & Tourismus", slug: "gastronomie-tourismus", kind: "industry" },
  { name: "Medien & Entertainment", slug: "medien-entertainment", kind: "industry" },
  { name: "Sonstige Branche", slug: "sonstige-branche", kind: "industry" },
  // Creator-Nischen
  { name: "Fitness & Gesundheit", slug: "creator-fitness", kind: "creator_niche" },
  { name: "Fashion & Beauty", slug: "creator-fashion", kind: "creator_niche" },
  { name: "Food & Kochen", slug: "creator-food", kind: "creator_niche" },
  { name: "Gaming", slug: "creator-gaming", kind: "creator_niche" },
  { name: "Reisen & Outdoor", slug: "creator-reisen", kind: "creator_niche" },
  { name: "Familie & Alltag", slug: "creator-familie", kind: "creator_niche" },
  { name: "Tech & Gadgets", slug: "creator-tech", kind: "creator_niche" },
  { name: "Comedy & Entertainment", slug: "creator-comedy", kind: "creator_niche" },
  { name: "Bildung & Finanzen", slug: "creator-bildung", kind: "creator_niche" },
  { name: "Lifestyle", slug: "creator-lifestyle", kind: "creator_niche" },
];

export function seedDatabase(db: Database): void {
  // Echte UUIDs als id (nicht der Slug): lib/validation/onboarding.ts erwartet
  // z.uuid() für industryId/categoryId — 1:1 aus dem Original übernommen.
  for (const c of CATEGORIES) {
    db.run("insert into categories (id, name, slug, kind) values (?, ?, ?, ?)", [
      crypto.randomUUID(),
      c.name,
      c.slug,
      c.kind,
    ]);
  }
  db.run("insert into platform_settings (key, value) values ('commission_pct', ?)", [
    JSON.stringify(10),
  ]);
}
