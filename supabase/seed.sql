-- =====================================================================
-- SponsorMatch — Seed: fiktive Marktplatz-Daten (M3).
--
-- Voraussetzung: Die Demo-Nutzer existieren bereits (Signup-Trigger hat
-- die profiles-Zeilen angelegt) — dafür einmalig ausführen:
--   SUPABASE_SERVICE_ROLE_KEY=… node scripts/seed-demo-users.mjs
--
-- Hintergrund: profiles.user_id ist NOT NULL FK → auth.users; Profile
-- ohne Login-Nutzer sind nicht möglich, und direkte auth.users-Inserts
-- vermeiden wir bewusst (Admin-API statt SQL).
--
-- Dieses Skript ist idempotent: Rollenprofile per ON CONFLICT, Listings
-- per NOT-EXISTS-Guard auf (Autor, Titel). Fehlende Nutzer werden
-- übersprungen (insert … select liefert dann 0 Zeilen).
-- =====================================================================

-- ---- Basisprofile vervollständigen ------------------------------------
update public.profiles p set
  bio = v.bio,
  region = v.region::public.region,
  onboarding_completed = true
from (values
  ('mara-falke',           'Mittelstreckenläuferin aus Regensburg, DM-Finalistin über 1.500 m. Ich suche Partner, die den Weg Richtung EM 2028 mitgehen.', 'bayern'),
  ('sv-blauweiss-hamburg', 'Traditionsverein aus Hamburg-Altona mit 14 Jugendmannschaften und eigener Fußballschule. Sponsoren erreichen bei uns jedes Wochenende die ganze Familie.', 'hamburg'),
  ('jonas-kraxler',        'Kletterer & Outdoor-Filmer. Ich nehme mein Publikum mit auf Alpentouren — ehrlich, nahbar und ohne Filter.', 'berlin'),
  ('fitmitanna',           'Fitness- und Ernährungs-Content für Frauen, die im Alltag stark bleiben wollen. Tägliche Workouts, wöchentliche Rezepte.', 'nordrhein_westfalen'),
  ('ec-eisbaeren-tirol',   'Eishockey-Club aus Tirol, Zuschauerschnitt 2.400. Bandenwerbung, Trikot und Social Media aus einer Hand.', 'at'),
  ('alpenquell-gmbh',      'Bio-Mineralwasser aus den Allgäuer Alpen. Wir unterstützen Ausdauersport von der Basis bis zur Spitze.', 'bayern'),
  ('velotech-bikes',       'Direktversender für Gravel- und Rennräder. Wir rüsten Athlet:innen aus, die Geschichten erzählen.', 'nordrhein_westfalen'),
  ('finanzhanse-ag',       'Versicherungs- und Vorsorgelösungen für Sportler:innen und Vereine — norddeutsch, verlässlich, langfristig.', 'hamburg'),
  ('gipfelkleidung-ag',    'Nachhaltige Outdoor-Bekleidung aus der Schweiz. Wir suchen Partner mit echter Bergleidenschaft.', 'ch')
) as v(slug, bio, region)
where p.slug = v.slug or p.slug like v.slug || '-%';

-- ---- Rollenprofile: Gesponserte ---------------------------------------
insert into public.sponsee_profiles
  (profile_id, type, category_id, reach_total, audience, social_links, past_sponsors, price_min, price_max)
select p.id, v.type::public.sponsee_type, c.id, v.reach,
       v.audience::jsonb, v.socials::jsonb, v.past, v.price_min, v.price_max
from (values
  ('mara-falke', 'athlete', 'laufen-leichtathletik', 45000,
   '{"age_groups":["18–24","25–34"],"interests":["Fitness","Ernährung","Laufen"]}',
   '{"instagram":"https://instagram.com/mara.falke.run"}',
   array['Landessportbund Bayern'], 25000, 150000),
  ('sv-blauweiss-hamburg', 'club', 'fussball', 12000,
   '{"age_groups":["25–34","35–44","45+"],"interests":["Fußball","Familie","Region"]}',
   '{"instagram":"https://instagram.com/svblauweisshh"}',
   array['Getränke Petersen','Autohaus Nord'], 50000, 500000),
  ('jonas-kraxler', 'creator', 'creator-reisen', 89000,
   '{"age_groups":["18–24","25–34"],"interests":["Outdoor","Reisen","Klettern"]}',
   '{"instagram":"https://instagram.com/jonas.kraxler","youtube":"https://youtube.com/@jonaskraxler"}',
   array['Bergzeit'], 80000, 300000),
  ('fitmitanna', 'creator', 'creator-fitness', 230000,
   '{"age_groups":["18–24","25–34","35–44"],"interests":["Fitness","Ernährung","Lifestyle"]}',
   '{"instagram":"https://instagram.com/fitmitanna","tiktok":"https://tiktok.com/@fitmitanna"}',
   array['Foodspring','Gymondo'], 150000, 800000),
  ('ec-eisbaeren-tirol', 'club', 'eishockey', 18000,
   '{"age_groups":["25–34","35–44","45+"],"interests":["Eishockey","Region","Familie"]}',
   '{"instagram":"https://instagram.com/eisbaeren.tirol"}',
   array['Tiroler Sparkasse'], 100000, 1000000)
) as v(slug, type, category_slug, reach, audience, socials, past, price_min, price_max)
join public.profiles p on (p.slug = v.slug or p.slug like v.slug || '-%')
join public.categories c on c.slug = v.category_slug
on conflict (profile_id) do nothing;

-- ---- Rollenprofile: Sponsoren ------------------------------------------
insert into public.sponsor_profiles
  (profile_id, company_name, industry_id, company_size, budget_min, budget_max, target_audience)
select p.id, v.company, c.id, v.size::public.company_size, v.budget_min, v.budget_max, v.audience::jsonb
from (values
  ('alpenquell-gmbh', 'AlpenQuell GmbH', 'ernaehrung-getraenke', '51-200', 100000, 1000000,
   '{"age_groups":["18–24","25–34"],"interests":["Laufen","Fitness","Outdoor"]}'),
  ('velotech-bikes', 'VeloTech Bikes GmbH', 'sportartikel', '11-50', 50000, 500000,
   '{"age_groups":["25–34","35–44"],"interests":["Radsport","Outdoor","Technik"]}'),
  ('finanzhanse-ag', 'FinanzHanse AG', 'finanzen-versicherung', '201-1000', 200000, 2000000,
   '{"age_groups":["25–34","35–44","45+"],"interests":["Fußball","Familie","Vorsorge"]}'),
  ('gipfelkleidung-ag', 'GipfelKleidung AG', 'mode-lifestyle', '11-50', 80000, 600000,
   '{"age_groups":["18–24","25–34"],"interests":["Outdoor","Klettern","Nachhaltigkeit"]}')
) as v(slug, company, industry_slug, size, budget_min, budget_max, audience)
join public.profiles p on (p.slug = v.slug or p.slug like v.slug || '-%')
join public.categories c on c.slug = v.industry_slug
on conflict (profile_id) do nothing;

-- ---- Listings ------------------------------------------------------------
insert into public.listings
  (author_profile_id, direction, title, description, category_id, region, budget_min, budget_max, reach_required, status)
select p.id, v.direction::public.listing_direction, v.title, v.description,
       c.id, v.region::public.region, v.budget_min, v.budget_max, v.reach_required, 'active'
from (values
  -- Gesponserte suchen Sponsoren
  ('mara-falke', 'seeking_sponsor',
   'Mittelstreckenläuferin sucht Hauptsponsor für die Saison 2027',
   'DM-Finalistin über 1.500 m mit klarem Ziel EM 2028. Ich biete Logo auf Wettkampf- und Trainingskleidung, monatliche Social-Media-Features und Auftritte bei Laufevents. Trainingsstandort Regensburg, deutschlandweite Wettkämpfe.',
   'laufen-leichtathletik', 'bayern', 25000, 150000, null),
  ('sv-blauweiss-hamburg', 'seeking_sponsor',
   'Trikotsponsor für 14 Jugendmannschaften gesucht',
   'Unser Verein erreicht jedes Wochenende über 2.000 Menschen am Platz und 12.000 online. Wir bieten Trikot- und Bandenwerbung, Turnier-Naming und Präsenz im Vereinsheft — ideal für regional verwurzelte Unternehmen.',
   'fussball', 'hamburg', 50000, 500000, null),
  ('sv-blauweiss-hamburg', 'seeking_sponsor',
   'Namenspartner für unser Sommer-Jugendturnier',
   'Das Blauweiss-Sommerturnier zieht jährlich 60 Jugendteams aus ganz Norddeutschland an. Als Namenspartner bist du auf allen Materialien, im Livestream und in der lokalen Presse präsent.',
   'fussball', 'hamburg', 100000, 300000, null),
  ('jonas-kraxler', 'seeking_sponsor',
   'Outdoor-Creator sucht Ausrüstungspartner für Alpenprojekt',
   'Vierteilige YouTube-Serie über die Watzmann-Ostwand ist in Planung. Ich suche einen Partner für Ausrüstung und Reisekosten — im Gegenzug gibt es Produkt-Integrationen, die nicht nach Werbung aussehen, plus Instagram-Begleitung.',
   'creator-reisen', 'berlin', 80000, 300000, null),
  ('fitmitanna', 'seeking_sponsor',
   'Langfristige Brand-Partnerschaft im Bereich Fitness & Ernährung',
   '230.000 Follower, 78 % Frauen zwischen 18 und 44, Engagement-Rate 6,2 %. Ich suche eine Marke für eine 12-Monats-Partnerschaft mit monatlichen Integrationen, Rabattcode-Tracking und gemeinsamen Kampagnen.',
   'creator-fitness', 'nordrhein_westfalen', 150000, 800000, null),
  ('ec-eisbaeren-tirol', 'seeking_sponsor',
   'Bandenwerbung & Trikotsponsoring beim EC Eisbären Tirol',
   'Heimspiele vor 2.400 Fans, Livestream mit 5.000 Abrufen pro Spiel. Pakete von der LED-Bande bis zum Brust-Sponsoring — auch für deutsche Marken interessant, die in Österreich sichtbar werden wollen.',
   'eishockey', 'at', 100000, 1000000, null),
  -- Sponsoren bieten Sponsorings an
  ('alpenquell-gmbh', 'offering_sponsorship',
   'AlpenQuell sucht Ausdauersportler:innen für das Team 2027',
   'Wir stellen Produktversorgung plus Jahresbudget für Läufer:innen, Triathlet:innen und Radsportler:innen mit authentischer Community. Wichtig sind uns Regionalität im DACH-Raum und Themen rund um Ernährung und Training.',
   'laufen-leichtathletik', 'bayern', 100000, 500000, 20000),
  ('alpenquell-gmbh', 'offering_sponsorship',
   'Getränkepartner für Laufevents und Vereinssport',
   'Für Vereine und Eventveranstalter übernehmen wir die Getränkeversorgung und zahlen einen Werbekostenzuschuss — gegen Logo-Präsenz an der Strecke und in euren Kanälen.',
   'laufen-leichtathletik', 'bayern', 50000, 200000, 5000),
  ('velotech-bikes', 'offering_sponsorship',
   'VeloTech rüstet Rad-Creator und Gravel-Racer aus',
   'Bike-Leihgabe plus Budget für Content-Creator mit Fokus Rad, Gravel oder Bikepacking. Wir erwarten zwei Integrationen pro Quartal und ehrliches Feedback zu unseren Rädern.',
   'radsport', 'nordrhein_westfalen', 50000, 300000, 10000),
  ('finanzhanse-ag', 'offering_sponsorship',
   'FinanzHanse fördert Vereine in Norddeutschland',
   'Wir übernehmen Trikot- oder Bandensponsoring für Amateurvereine in Hamburg, Schleswig-Holstein und Niedersachsen. Uns interessiert Breitenwirkung in der Region, nicht die Ligahöhe.',
   'fussball', 'hamburg', 200000, 1000000, 5000),
  ('gipfelkleidung-ag', 'offering_sponsorship',
   'GipfelKleidung sucht Berg- und Outdoor-Athlet:innen',
   'Ausrüstung plus Tagessätze für Kletterer, Bergläuferinnen und Alpinisten mit nachvollziehbarer Outdoor-Community. Nachhaltigkeit ist bei uns kein Feigenblatt — das sollte zu deinen Inhalten passen.',
   'sonstiger-sport', 'ch', 80000, 600000, 15000)
) as v(slug, direction, title, description, category_slug, region, budget_min, budget_max, reach_required)
join public.profiles p on (p.slug = v.slug or p.slug like v.slug || '-%')
left join public.categories c on c.slug = v.category_slug
where not exists (
  select 1 from public.listings l
  where l.author_profile_id = p.id and l.title = v.title
);
