import type { SqlDatabase } from "./client";
import { select, selectOne } from "./query";
import { hashPassword } from "@/auth/password";
import { completeSponsorOnboarding, completeSponseeOnboarding } from "./repositories/profiles";
import { startConversation, sendMessage, markConversationRead } from "./repositories/conversations";
import { createDeal, counterDealOffer, advanceDealStatus, acceptContract } from "./repositories/deals";
import { createListing } from "./repositories/listings";
import type { CompanySize, DealMilestoneInput, Profile, ProfileRole, Region, SponseeType } from "@/lib/types";

/**
 * Flenzko — Referenzdaten (Taxonomie + Plattform-Einstellungen) + Demo-Datensatz
 * (Sponsoren, Gesponserte, Chats, Deals) für den MVP-Showcase. Läuft einmalig
 * beim allerersten Laden im Browser (leere IndexedDB) — siehe db/client.ts.
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

/** Demo-Login für die Präsentation — für alle Beispielprofile identisch. */
export const DEMO_PASSWORD = "Demo1234!";

type SponsorSeed = {
  slug: string;
  displayName: string;
  email: string;
  bio: string;
  region: Region;
  verified: boolean;
  companyName: string;
  industrySlug: string;
  companySize: CompanySize;
  budgetMin: number;
  budgetMax: number;
  interests: string[];
  ageGroups: string[];
};

type SponseeSeed = {
  slug: string;
  displayName: string;
  email: string;
  bio: string;
  region: Region;
  verified: boolean;
  type: SponseeType;
  categorySlug: string;
  reachTotal: number;
  priceMin: number;
  priceMax: number;
  interests: string[];
  ageGroups: string[];
  socialLinks: Record<string, string>;
  pastSponsors: string[];
};

const SPONSORS: SponsorSeed[] = [
  {
    slug: "nordsport-trikot-gmbh",
    displayName: "NordSport Trikot GmbH",
    email: "nordsport@demo.flenzko",
    bio: "Hamburger Ausrüster für Vereins- und Teamtrikots — seit 2014 Partner von über 60 Amateur- und Profivereinen in Norddeutschland.",
    region: "hamburg",
    verified: true,
    companyName: "NordSport Trikot GmbH",
    industrySlug: "sportartikel",
    companySize: "51-200",
    budgetMin: 200000,
    budgetMax: 1500000,
    interests: ["Teamsport", "Vereinsleben", "Lokale Verbundenheit"],
    ageGroups: ["18–24", "25–34", "35–44"],
  },
  {
    slug: "greenfuel-energie-ag",
    displayName: "GreenFuel Energie AG",
    email: "greenfuel@demo.flenzko",
    bio: "Bayerischer Ökostrom-Anbieter — sucht Gesichter für die Kampagne 'Energie, die zu dir passt' im Sport- und Creator-Umfeld.",
    region: "bayern",
    verified: true,
    companyName: "GreenFuel Energie AG",
    industrySlug: "energie-bau",
    companySize: "201-1000",
    budgetMin: 500000,
    budgetMax: 3000000,
    interests: ["Nachhaltigkeit", "Fitness", "Outdoor"],
    ageGroups: ["25–34", "35–44", "45+"],
  },
  {
    slug: "cafe-kranz-roestereien",
    displayName: "Café Kranz Röstereien",
    email: "cafekranz@demo.flenzko",
    bio: "Kleine Berliner Rösterei-Kette (4 Filialen) — testet erstmals Creator-Kooperationen im Food-Bereich.",
    region: "berlin",
    verified: false,
    companyName: "Café Kranz Röstereien",
    industrySlug: "gastronomie-tourismus",
    companySize: "1-10",
    budgetMin: 50000,
    budgetMax: 300000,
    interests: ["Food", "Kaffee", "Lokales"],
    ageGroups: ["18–24", "25–34"],
  },
  {
    slug: "fintrust-versicherungen",
    displayName: "FinTrust Versicherungen",
    email: "fintrust@demo.flenzko",
    bio: "Versicherungsgruppe aus Köln — fördert Nachwuchssport-Vereine im Rahmen des Programms 'FinTrust hält zusammen'.",
    region: "nordrhein_westfalen",
    verified: true,
    companyName: "FinTrust Versicherungen",
    industrySlug: "finanzen-versicherung",
    companySize: "201-1000",
    budgetMin: 300000,
    budgetMax: 2000000,
    interests: ["Nachwuchsförderung", "Vereinsleben", "Sicherheit"],
    ageGroups: ["25–34", "35–44", "45+"],
  },
  {
    slug: "pulse-sportswear",
    displayName: "Pulse Sportswear",
    email: "pulse@demo.flenzko",
    bio: "Stuttgarter Fitness-Modelabel — launcht die neue Kollektion 'Pulse Move' und sucht authentische Fitness-Creator:innen.",
    region: "baden_wuerttemberg",
    verified: true,
    companyName: "Pulse Sportswear",
    industrySlug: "mode-lifestyle",
    companySize: "11-50",
    budgetMin: 100000,
    budgetMax: 800000,
    interests: ["Fitness", "Mode", "Lifestyle"],
    ageGroups: ["18–24", "25–34"],
  },
];

const SPONSEES: SponseeSeed[] = [
  {
    slug: "mara-vogt",
    displayName: "Mara Vogt",
    email: "mara@demo.flenzko",
    bio: "Halbmarathon- und Trail-Läuferin aus München, Landeskader Bayern. Teilt Training und Rennalltag mit wachsender Community.",
    region: "bayern",
    verified: true,
    type: "athlete",
    categorySlug: "laufen-leichtathletik",
    reachTotal: 45000,
    priceMin: 50000,
    priceMax: 250000,
    interests: ["Laufen", "Trailrunning", "Ernährung"],
    ageGroups: ["18–24", "25–34"],
    socialLinks: { instagram: "@mara.laeuft" },
    pastSponsors: ["Nürnberger Versicherung", "Isostar"],
  },
  {
    slug: "tsv-lindenau-04",
    displayName: "TSV Lindenau 04",
    email: "tsvlindenau@demo.flenzko",
    bio: "Traditionsverein aus Sachsen, 1. Männermannschaft spielt Landesliga. 340 Mitglieder, starke Jugendabteilung.",
    region: "sachsen",
    verified: true,
    type: "club",
    categorySlug: "fussball",
    reachTotal: 12000,
    priceMin: 100000,
    priceMax: 600000,
    interests: ["Amateurfußball", "Jugendförderung", "Regionale Präsenz"],
    ageGroups: ["18–24", "25–34", "35–44"],
    socialLinks: { instagram: "@tsvlindenau04" },
    pastSponsors: ["Sparkasse Muldental"],
  },
  {
    slug: "jonas-keller",
    displayName: "Jonas Keller",
    email: "jonas@demo.flenzko",
    bio: "Fitness-Creator aus Berlin — Kraft- und Ernährungscoaching für Einsteiger:innen, 210K Follower über alle Kanäle.",
    region: "berlin",
    verified: true,
    type: "creator",
    categorySlug: "creator-fitness",
    reachTotal: 210000,
    priceMin: 150000,
    priceMax: 900000,
    interests: ["Krafttraining", "Ernährung", "Mindset"],
    ageGroups: ["18–24", "25–34"],
    socialLinks: { instagram: "@jonaslifts", tiktok: "@jonaslifts", youtube: "JonasKellerFitness" },
    pastSponsors: ["Foodspring", "Gymshark"],
  },
  {
    slug: "fabienne-roth",
    displayName: "Fabienne Roth",
    email: "fabienne@demo.flenzko",
    bio: "Schwimmerin, hessische Landesmeisterin über 200m Freistil. Auf der Suche nach ihrem ersten Sponsoring-Partner.",
    region: "hessen",
    verified: false,
    type: "athlete",
    categorySlug: "schwimmen",
    reachTotal: 18000,
    priceMin: 30000,
    priceMax: 150000,
    interests: ["Schwimmen", "Leistungssport", "Studium & Sport"],
    ageGroups: ["18–24"],
    socialLinks: { instagram: "@fabienne.swims" },
    pastSponsors: [],
  },
  {
    slug: "basketkids-frankfurt",
    displayName: "BasketKids Frankfurt e.V.",
    email: "basketkids@demo.flenzko",
    bio: "Basketball-Nachwuchsverein in Frankfurt, 6 Jugendmannschaften. Sucht Unterstützung für neue Trikots und Trainingslager.",
    region: "hessen",
    verified: true,
    type: "club",
    categorySlug: "basketball",
    reachTotal: 5000,
    priceMin: 50000,
    priceMax: 200000,
    interests: ["Nachwuchssport", "Basketball", "Vereinsleben"],
    ageGroups: ["13–17", "18–24"],
    socialLinks: { instagram: "@basketkids_ffm" },
    pastSponsors: [],
  },
  {
    slug: "elif-demir",
    displayName: "Elif Demir",
    email: "elif@demo.flenzko",
    bio: "Food-Creatorin aus Köln — einfache Alltagsrezepte für 89K Follower, Schwerpunkt regionale & saisonale Küche.",
    region: "nordrhein_westfalen",
    verified: true,
    type: "creator",
    categorySlug: "creator-food",
    reachTotal: 89000,
    priceMin: 80000,
    priceMax: 400000,
    interests: ["Food", "Kochen", "Nachhaltigkeit"],
    ageGroups: ["18–24", "25–34"],
    socialLinks: { instagram: "@elifkocht", tiktok: "@elifkocht" },
    pastSponsors: ["Rewe regional"],
  },
];

async function insertProfile(
  db: SqlDatabase,
  input: { role: ProfileRole; displayName: string; slug: string; email: string; bio: string; region: Region; verified: boolean }
): Promise<Profile> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  db.run(
    `insert into profiles
      (id, role, display_name, slug, avatar_url, bio, region, website, onboarding_completed, is_verified, password_hash, email, created_at, updated_at)
     values (?, ?, ?, ?, null, ?, ?, null, 1, ?, ?, ?, ?, ?)`,
    [id, input.role, input.displayName, input.slug, input.bio, input.region, input.verified ? 1 : 0, passwordHash, input.email, now, now]
  );
  return selectOne<Profile>(db, "select * from profiles where id = ?", [id])!;
}

function milestones(...rows: [string, number][]): DealMilestoneInput[] {
  return rows.map(([title, amount]) => ({ title, amount, due_date: null }));
}

function sum(rows: DealMilestoneInput[]): number {
  return rows.reduce((s, m) => s + m.amount, 0);
}

async function seedDemoData(db: SqlDatabase, categoryIds: Map<string, string>): Promise<void> {
  const sponsors = new Map<string, Profile>();
  for (const s of SPONSORS) {
    const profile = await insertProfile(db, {
      role: "sponsor",
      displayName: s.displayName,
      slug: s.slug,
      email: s.email,
      bio: s.bio,
      region: s.region,
      verified: s.verified,
    });
    completeSponsorOnboarding(db, profile.id, {
      bio: s.bio,
      region: s.region,
      website: null,
      targetAudience: { age_groups: s.ageGroups, interests: s.interests },
      companyName: s.companyName,
      industryId: categoryIds.get(s.industrySlug)!,
      companySize: s.companySize,
      budgetMin: s.budgetMin,
      budgetMax: s.budgetMax,
      vatId: null,
    });
    sponsors.set(s.slug, profile);
  }

  const sponsees = new Map<string, Profile>();
  for (const s of SPONSEES) {
    const profile = await insertProfile(db, {
      role: "sponsee",
      displayName: s.displayName,
      slug: s.slug,
      email: s.email,
      bio: s.bio,
      region: s.region,
      verified: s.verified,
    });
    completeSponseeOnboarding(db, profile.id, {
      bio: s.bio,
      region: s.region,
      website: null,
      audience: { age_groups: s.ageGroups, interests: s.interests },
      type: s.type,
      categoryId: categoryIds.get(s.categorySlug)!,
      reachTotal: s.reachTotal,
      socialLinks: s.socialLinks,
      pastSponsors: s.pastSponsors,
      priceMin: s.priceMin,
      priceMax: s.priceMax,
    });
    sponsees.set(s.slug, profile);
  }

  const LISTINGS: {
    authorSlug: string;
    authorRole: "sponsor" | "sponsee";
    direction: "offering_sponsorship" | "seeking_sponsor";
    title: string;
    description: string;
    categorySlug: string | null;
    region: Region | null;
    budgetMin: number | null;
    budgetMax: number | null;
    reachRequired: number | null;
  }[] = [
    {
      authorSlug: "nordsport-trikot-gmbh",
      authorRole: "sponsor",
      direction: "offering_sponsorship",
      title: "Trikotsponsoring für Amateurvereine gesucht",
      description: "Wir stellen Trikots & Bandenwerbung für 1-2 Vereine im Fußball- oder Handballbereich in Norddeutschland — inkl. Logo-Platzierung und Social-Media-Erwähnung.",
      categorySlug: "fussball",
      region: "hamburg",
      budgetMin: 200000,
      budgetMax: 1000000,
      reachRequired: 5000,
    },
    {
      authorSlug: "pulse-sportswear",
      authorRole: "sponsor",
      direction: "offering_sponsorship",
      title: "Fitness-Creator:in für Kollektions-Launch gesucht",
      description: "Für den Launch von 'Pulse Move' suchen wir 2-3 authentische Fitness-Creator:innen für Reels, Story-Content und ein Launch-Video.",
      categorySlug: "creator-fitness",
      region: null,
      budgetMin: 100000,
      budgetMax: 800000,
      reachRequired: 50000,
    },
    {
      authorSlug: "greenfuel-energie-ag",
      authorRole: "sponsor",
      direction: "offering_sponsorship",
      title: "Sportler:innen & Creator für Nachhaltigkeits-Kampagne",
      description: "Gesucht: Gesichter für 'Energie, die zu dir passt' — Sport- oder Food-Content mit Fokus auf einen bewussten, nachhaltigen Alltag.",
      categorySlug: null,
      region: "bayern",
      budgetMin: 500000,
      budgetMax: 3000000,
      reachRequired: 20000,
    },
    {
      authorSlug: "jonas-keller",
      authorRole: "sponsee",
      direction: "seeking_sponsor",
      title: "Fitness-Creator sucht langfristige Markenpartnerschaft",
      description: "210K Follower über Instagram, TikTok & YouTube — suche 1-2 Marken für eine dauerhafte Zusammenarbeit statt Einzelposts, Schwerpunkt Kraftsport & Ernährung.",
      categorySlug: "creator-fitness",
      region: "berlin",
      budgetMin: null,
      budgetMax: null,
      reachRequired: null,
    },
    {
      authorSlug: "mara-vogt",
      authorRole: "sponsee",
      direction: "seeking_sponsor",
      title: "Läuferin sucht Sponsor zur Halbmarathon-Saison",
      description: "Landeskader Bayern, aktiv auf Instagram — suche Unterstützung durch einen Ausrüster oder Ernährungs-Partner für die kommende Renn-Saison.",
      categorySlug: "laufen-leichtathletik",
      region: "bayern",
      budgetMin: null,
      budgetMax: null,
      reachRequired: null,
    },
    {
      authorSlug: "tsv-lindenau-04",
      authorRole: "sponsee",
      direction: "seeking_sponsor",
      title: "Fußballverein sucht Trikotsponsor für die Rückrunde",
      description: "Traditionsverein mit starker Jugendabteilung — suchen einen Trikot- oder Bandenwerbung-Partner für die 1. Männermannschaft.",
      categorySlug: "fussball",
      region: "sachsen",
      budgetMin: null,
      budgetMax: null,
      reachRequired: null,
    },
    {
      authorSlug: "basketkids-frankfurt",
      authorRole: "sponsee",
      direction: "seeking_sponsor",
      title: "Nachwuchsverein sucht Unterstützung für neue Ausrüstung",
      description: "6 Jugendmannschaften, wachsender Verein — freuen uns über Sponsoring für Trikots, Bälle oder ein Trainingslager.",
      categorySlug: "basketball",
      region: "hessen",
      budgetMin: null,
      budgetMax: null,
      reachRequired: null,
    },
    {
      authorSlug: "elif-demir",
      authorRole: "sponsee",
      direction: "seeking_sponsor",
      title: "Food-Creatorin offen für Marken-Kooperationen",
      description: "89K Follower, Schwerpunkt regionale & saisonale Küche — offen für Rezeptvideos, Postings oder langfristige Zusammenarbeit mit Food- oder Küchenmarken.",
      categorySlug: "creator-food",
      region: "nordrhein_westfalen",
      budgetMin: null,
      budgetMax: null,
      reachRequired: null,
    },
  ];

  for (const l of LISTINGS) {
    const author = l.authorRole === "sponsor" ? sponsors.get(l.authorSlug)! : sponsees.get(l.authorSlug)!;
    createListing(db, {
      authorProfileId: author.id,
      direction: l.direction,
      title: l.title,
      description: l.description,
      categoryId: l.categorySlug ? categoryIds.get(l.categorySlug)! : null,
      region: l.region,
      budgetMin: l.budgetMin,
      budgetMax: l.budgetMax,
      reachRequired: l.reachRequired,
      status: "active",
      expiresAt: null,
    });
  }

  function conversationBetween(sponsorSlug: string, sponseeSlug: string): { sponsor: Profile; sponsee: Profile; conversationId: string } {
    const sponsor = sponsors.get(sponsorSlug)!;
    const sponsee = sponsees.get(sponseeSlug)!;
    const result = startConversation(db, sponsor, sponsee.id, null);
    if ("error" in result) throw new Error(result.error);
    return { sponsor, sponsee, conversationId: result.id };
  }

  // ---- Konversation 1: NordSport ↔ TSV Lindenau 04 — Deal "agreed" ----
  {
    const { sponsor, sponsee, conversationId } = conversationBetween("nordsport-trikot-gmbh", "tsv-lindenau-04");
    sendMessage(db, conversationId, sponsor.id, "Hallo! Wir sind auf euren Verein aufmerksam geworden und würden gern die Trikots für die Rückrunde sponsern. Hättet ihr Interesse an einem Gespräch?");
    sendMessage(db, conversationId, sponsee.id, "Auf jeden Fall! Trikots und gern auch Bandenwerbung bei Heimspielen — worüber sprechen wir preislich?");
    sendMessage(db, conversationId, sponsor.id, "Ich schick euch gleich ein konkretes Angebot als Deal-Vorschlag, dann könnt ihr in Ruhe drüberschauen.");
    const m1 = milestones(["Trikotdruck & Logo-Platzierung", 150000], ["Bandenwerbung Heimspiele Rückrunde", 100000]);
    const dealId = createDeal(db, sponsor, {
      conversationId,
      title: "Trikotsponsoring Rückrunde 2026",
      description: "NordSport Trikot GmbH stattet die 1. Mannschaft mit neuen Trikots aus (Logo Brust) und erhält Bandenwerbung bei allen Heimspielen der Rückrunde.",
      amountTotal: sum(m1),
      milestones: m1,
    });
    acceptContract(db, sponsor, dealId);
    acceptContract(db, sponsee, dealId);
    markConversationRead(db, conversationId, sponsor.id);
  }

  // ---- Konversation 2: NordSport ↔ Mara Vogt — Deal "negotiating" ----
  {
    const { sponsor, sponsee, conversationId } = conversationBetween("nordsport-trikot-gmbh", "mara-vogt");
    sendMessage(db, conversationId, sponsor.id, "Hi Mara, wir verfolgen deine Läufe schon eine Weile — hättest du Lust auf eine Kooperation zur Halbmarathon-Saison?");
    sendMessage(db, conversationId, sponsee.id, "Hi! Sehr gern, klingt spannend. Was schwebt euch vor?");
    const m1 = milestones(["3 Instagram-Posts zur Laufschuh-Kollektion", 80000]);
    const dealId = createDeal(db, sponsor, {
      conversationId,
      title: "Laufschuh-Kooperation Halbmarathon-Saison",
      description: "3 Instagram-Posts inkl. Story-Serie zur neuen Laufschuh-Kollektion im Vorfeld der Halbmarathon-Saison.",
      amountTotal: sum(m1),
      milestones: m1,
    });
    sendMessage(db, conversationId, sponsee.id, "Danke für das Angebot! Für 3 Posts inkl. Story-Serie und Renntag-Content würde ich gern etwas höher gehen — hier mein Gegenvorschlag.");
    const m2 = milestones(["3 Instagram-Posts zur Laufschuh-Kollektion", 90000], ["Story-Serie & Content vom Renntag", 30000]);
    counterDealOffer(db, sponsee, {
      dealId,
      title: "Laufschuh-Kooperation Halbmarathon-Saison",
      description: "3 Instagram-Posts inkl. Story-Serie zur neuen Laufschuh-Kollektion, plus Content vom Renntag selbst.",
      amountTotal: sum(m2),
      milestones: m2,
    });
  }

  // ---- Konversation 3: Pulse Sportswear ↔ Jonas Keller — Deal "offered" (Live-Demo!) ----
  {
    const { sponsor, sponsee, conversationId } = conversationBetween("pulse-sportswear", "jonas-keller");
    sendMessage(db, conversationId, sponsor.id, "Hi Jonas, wir launchen im Frühjahr unsere neue Kollektion 'Pulse Move' und du wärst unser Wunsch-Gesicht dafür. Hättest du Zeit für ein Kennenlerngespräch?");
    sendMessage(db, conversationId, sponsee.id, "Hey, klingt gut — schickt mir gern direkt ein Angebot, dann sehe ich, ob's zeitlich und inhaltlich passt.");
    const m1 = milestones(["Kickoff-Reel & Story-Serie zum Launch", 200000], ["Langes Launch-Video (YouTube)", 250000]);
    createDeal(db, sponsor, {
      conversationId,
      title: "Fitness-Kollektion 'Pulse Move' — Launch-Kampagne",
      description: "Ein Kickoff-Reel inkl. Story-Serie zum Kollektionslaunch sowie ein längeres Launch-Video auf YouTube. Produkte werden vorab kostenlos bereitgestellt.",
      amountTotal: sum(m1),
      milestones: m1,
    });
    // Bewusst offen gelassen (Status "offered") — ideal für eine Live-Demo von
    // Annehmen/Verhandeln/Ablehnen direkt im Dashboard bzw. auf /deals/:id.
  }

  // ---- Konversation 4: GreenFuel ↔ Elif Demir — Deal "completed" ----
  {
    const { sponsor, sponsee, conversationId } = conversationBetween("greenfuel-energie-ag", "elif-demir");
    sendMessage(db, conversationId, sponsor.id, "Hallo Elif, deine Rezeptvideos passen super zu unserer Kampagne 'Energie, die zu dir passt'. Wärst du für ein gemeinsames Video offen?");
    sendMessage(db, conversationId, sponsee.id, "Ja, total gern! Ich hab auch schon eine Idee für ein saisonales Rezept dazu.");
    sendMessage(db, conversationId, sponsor.id, "Perfekt, dann schicke ich dir den Vertrag — freuen uns auf die Zusammenarbeit!");
    const m1 = milestones(["Rezeptvideo 'Energie, die zu dir passt'", 300000]);
    const dealId = createDeal(db, sponsor, {
      conversationId,
      title: "Kampagnenvideo 'Energie, die zu dir passt'",
      description: "Ein Rezeptvideo inkl. Postings, in dem GreenFuel als nachhaltiger Energiepartner im Alltag eingebunden wird.",
      amountTotal: sum(m1),
      milestones: m1,
    });
    acceptContract(db, sponsor, dealId);
    acceptContract(db, sponsee, dealId);
    advanceDealStatus(db, sponsor, dealId, "funded");
    advanceDealStatus(db, sponsor, dealId, "in_progress");
    db.run("update deal_milestones set status = 'paid' where deal_id = ?", [dealId]);
    advanceDealStatus(db, sponsor, dealId, "completed");
    markConversationRead(db, conversationId, sponsor.id);
    markConversationRead(db, conversationId, sponsee.id);
  }

  // ---- Konversation 5: FinTrust ↔ BasketKids Frankfurt — Deal "declined" ----
  {
    const { sponsor, sponsee, conversationId } = conversationBetween("fintrust-versicherungen", "basketkids-frankfurt");
    sendMessage(db, conversationId, sponsor.id, "Hallo, wir möchten Nachwuchsvereine in der Region fördern — hättet ihr Interesse an einer Zusammenarbeit für neue Trikots?");
    sendMessage(db, conversationId, sponsee.id, "Klingt interessant, schickt uns gern mehr Details.");
    const m1 = milestones(["Trikotsatz für 2 Jugendmannschaften", 60000]);
    const dealId = createDeal(db, sponsor, {
      conversationId,
      title: "Trikotsponsoring Jugendmannschaften",
      description: "Ausstattung von zwei Jugendmannschaften mit neuen Trikotsätzen inkl. FinTrust-Logo.",
      amountTotal: sum(m1),
      milestones: m1,
    });
    sendMessage(db, conversationId, sponsee.id, "Wir haben intern besprochen — das Budget passt für uns leider gerade nicht, wir bräuchten deutlich mehr für 2 komplette Sätze. Danke trotzdem für die Anfrage!");
    advanceDealStatus(db, sponsee, dealId, "declined");
  }

  // ---- Konversation 6: Café Kranz ↔ Fabienne Roth — nur Chat, noch kein Deal ----
  {
    const { sponsor, sponsee, conversationId } = conversationBetween("cafe-kranz-roestereien", "fabienne-roth");
    sendMessage(db, conversationId, sponsor.id, "Hallo Fabienne, wir sind eine kleine Rösterei-Kette aus Berlin und suchen erstmals eine sportliche Kooperation. Magst du uns kurz erzählen, wonach du suchst?");
    sendMessage(db, conversationId, sponsee.id, "Hi! Sehr gern — für mich wäre vor allem Unterstützung bei Trainingslager-Kosten und ein bisschen Sichtbarkeit interessant. Erzählt mir gern mehr zu euch.");
  }
}

/**
 * Legt den Demo-Datensatz an, aber nur einmal (Marker in platform_settings) —
 * so lässt sich das auch nachträglich auf einer bereits bestehenden lokalen
 * DB nachholen (siehe ensureDemoData), z. B. wenn jemand die Seite schon vor
 * Einführung der Demo-Daten besucht und dadurch eine "leere" IndexedDB hat.
 */
async function seedDemoDataOnce(db: SqlDatabase): Promise<boolean> {
  if (selectOne(db, "select value from platform_settings where key = 'demo_seeded'")) {
    return false;
  }
  // Marker fehlt — kann heißen "DB stammt von vor dem Demo-Datensatz" (dann
  // fehlen die Profile wirklich) ODER "DB stammt von vor Einführung des
  // Markers, hat den Datensatz aber schon" (z. B. erster Deploy-Stand ohne
  // Marker). Per E-Mail-Check unterscheiden, sonst gäb's einen
  // Unique-Constraint-Fehler beim erneuten Anlegen bereits vorhandener Demo-Profile.
  const demoAlreadyPresent = selectOne(db, "select id from profiles where email = ?", [SPONSORS[0].email]);
  if (!demoAlreadyPresent) {
    const rows = select<{ id: string; slug: string }>(db, "select id, slug from categories");
    const categoryIds = new Map(rows.map((r) => [r.slug, r.id]));
    await seedDemoData(db, categoryIds);
  }
  db.run("insert into platform_settings (key, value) values ('demo_seeded', ?)", [JSON.stringify(true)]);
  return true;
}

/** Erstinitialisierung einer komplett leeren DB (Taxonomie + Provisionssatz + Demo-Datensatz). */
export async function seedDatabase(db: SqlDatabase): Promise<void> {
  const categoryIds = new Map<string, string>();
  for (const c of CATEGORIES) {
    const id = crypto.randomUUID();
    categoryIds.set(c.slug, id);
    db.run("insert into categories (id, name, slug, kind) values (?, ?, ?, ?)", [id, c.name, c.slug, c.kind]);
  }
  db.run("insert into platform_settings (key, value) values ('commission_pct', ?)", [JSON.stringify(10)]);

  await seedDemoData(db, categoryIds);
  db.run("insert into platform_settings (key, value) values ('demo_seeded', ?)", [JSON.stringify(true)]);
}

/**
 * Nachträgliche Migration für bereits bestehende lokale Datenbanken (z. B.
 * von vor Einführung der Demo-Daten) — beim nächsten Laden aufgerufen, holt
 * den Demo-Datensatz nach, ohne die vorhandene DB zurückzusetzen. Gibt true
 * zurück, wenn etwas geändert wurde (dann muss neu persistiert werden).
 */
export async function ensureDemoData(db: SqlDatabase): Promise<boolean> {
  return seedDemoDataOnce(db);
}
