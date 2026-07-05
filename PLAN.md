# SponsorMatch — Projektplan

Zweiseitiger Marktplatz für Sponsoring-Deals im DACH-Raum.
Sponsoren (Firmen) ↔ Gesponserte (Sportler, Vereine, Creator). Monetarisierung über Provision pro Deal, abgesichert via Escrow (Stripe Connect).

**Status:** In Umsetzung. Design-System-Handoff (Claude Design, 10.06.2026) liegt vor und ist in `sponsormatch/design-system/` archiviert.
Umgesetzt (12.06.2026): Next.js-Scaffold (`sponsormatch/`), Design-Tokens (Light/Dark), Fonts (Archivo/Manrope/JetBrains Mono), 10 UI-Komponenten, Marketing-Landingpage. Noch offen aus dem Handoff: Form-/Feedback-Komponenten (Select, Switch, Tabs, Dialog, Toast, Tooltip, IconButton) — werden bei M2 portiert.
M1 umgesetzt (12.06.–02.07.2026): Supabase-Anbindung (`lib/supabase/`, `proxy.ts`), Migrationen `profiles` + `consents` (RLS, Signup-Trigger), Registrierung mit Rollenwahl & Consent-Erfassung, Login/Logout, E-Mail-Verifizierung (`/auth/callback`), geschützter Bereich, Input/Checkbox/Radio portiert, Vitest. Supabase-Projekt „SponsorMatch" live (`ckcmwmehzusgyzwbfqvd`, eu-central-1), Migrationen angewendet, `.env.local` gesetzt. **Offen:** Leaked-Password-Protection im Dashboard aktivieren (nicht per API möglich); deutsche E-Mail-Templates.

**M2 umgesetzt (03.07.2026):** Migration `categories` (37 Seed-Einträge: Sport/Branchen/Creator-Nischen) + `sponsor_profiles`/`sponsee_profiles` (RLS: Besitzer schreibt, Marktplatz liest) + Storage-Buckets `avatars` (public) und `media-kits` (privat, PDF ≤ 10 MB, signierte URLs). Select/Textarea portiert. Rollenspezifischer 3-Schritte-Onboarding-Wizard (`/onboarding`) mit zod-Validierung (Euro→Cent) und Mediakit-Upload. Öffentliche Profilseite `/profil/[slug]` mit Kennzahlen, Zielgruppe, Social-Links, Mediakit. Browser-E2E verifiziert (Testnutzerin Lena: Wizard → DB → Profilseite). 39 Tests grün. **Offen:** Avatar-Upload & Profil-bearbeiten-Seite (folgt mit M3-Suche), Testnutzer-Passwörter auf `SmTest!2026` gesetzt (nur Testdaten).

**M3 umgesetzt (03.07.2026):** Migration `listings` (Enums direction/status, RLS: Autor schreibt, Marktplatz liest aktive Listings, Admin alles) + Fix-Migration `avatars_owner_select` (der M2-Advisor-Fix hatte die einzige SELECT-Policy entfernt — dadurch scheiterten Storage-Upsert/Delete des Besitzers). Listings-CRUD (`/listings`, `/listings/neu` mit rollenabhängiger direction, `/listings/[id]` mit Autor-Karte, Kontakt-CTA-Platzhalter und Statuswechsel), Suchseite `/suche` (rollenabhängige Gegenseite, Filter Kategorie/Region/Budget/Reichweite, MatchCard mit Score), Matching v1 in `lib/matching/` (regelbasiert, `score(criteria, candidate)` → 0–100 mit Breakdown, Gewichte 30/25/15/15/15, ML-austauschbare Signatur), `/profil/bearbeiten` inkl. Avatar-Upload (M2-Übertrag; End-to-End gegen Live-Bucket verifiziert), Seed (`supabase/seed.sql`: 9 Demo-Profile + 11 Listings, Nutzer via `scripts/seed-demo-users.mjs` über die Admin-API, da `profiles.user_id` NOT NULL → auth.users). Header-Navigation ergänzt. 79 Tests grün, ESLint/Build grün.
**M3-DB-Schritte nachgezogen (04.07.2026):** Beide Migrationen via MCP angewendet (`m3_listings`, `m3_avatars_owner_select`), `get_advisors` geprüft. Seed teilweise eingespielt: E-Mail-Rate-Limit (Standard-SMTP, 2/h) ließ nur 2 der 9 Demo-Signups zu (Mara Falke, SV Blauweiss Hamburg — unbestätigte Nutzer, Passwort `SmDemo!2026`); zusätzlich NordSport-Testsponsor per SQL vervollständigt (Onboarding, Rollenprofil, 2 Listings). Live: 6 aktive Listings (inkl. 1 von Lena per UI erstellt — E2E verifiziert: Anlegen, Redirect, Statuswechsel Aktiv↔Pausiert, /suche beidseitig mit Match-Scores 62–70 %, Filter Region+Reichweite). `seed.sql` ist jetzt slug-suffix-tolerant; restliche 7 Demo-Nutzer später via `scripts/seed-demo-users.mjs` (Service-Role-Key) oder nach Rate-Limit-Fenster anlegen, dann `seed.sql` erneut ausführen (idempotent).
**Offen (nach M3):** Advisors melden 2 bekannte WARNs: `is_admin()` als SECURITY DEFINER für authenticated ausführbar (beabsichtigt — wird von RLS-Policies benötigt, verrät nur den eigenen Admin-Status) und Leaked-Password-Protection (Dashboard-Einstellung, seit M1 offen). Restliche 7 Seed-Profile. Kontakt-CTA verweist auf M4-Chat.

**M4 umgesetzt (04.07.2026):** Migration `m4_conversations_messages` (`conversations` mit unique Paar+Listing via `nulls not distinct`, `messages` mit body 1–2000, `notifications` gemäß §3; RLS strikt nur Beteiligte — bewusst ohne Admin-Zugriff auf Chats; `read_at` nur per Spalten-Grant durch den Empfänger; Notification-Insert und `conversations.updated_at`-Bump via Security-Definer-Trigger `handle_new_message`; `messages` in Publication `supabase_realtime`, replica identity full). Kontakt-CTA auf `/listings/[id]` ersetzt den Platzhalter, zusätzlich „Nachricht senden" auf `/profil/[slug]` (nur Sponsor↔Sponsee); `startConversation` verwendet bestehende Konversation wieder (23505-Race-Fallback). `/nachrichten` (letzte Nachricht, deutsche Zeitstempel „14:32/Gestern/04.07.2026", Ungelesen-Zähler) und `/nachrichten/[id]` (Chat mit Tages-Trennern, Senden per Client-Insert mit zod, Realtime-Subscription `postgres_changes` mit `realtime.setAuth`, read_at + Notification-Markierung beim Öffnen, danach `router.refresh()`), Ungelesen-Badge im App-Header (orange, Mono-Zahl). 91 Tests, ESLint und Build grün. Fehlerpfade degradieren sauber (fehlende Tabellen → leere Liste + geloggter Fehler, CTA zeigt deutsche Fehlermeldung) — im Browser gegen den Live-Stand verifiziert.
**M4-DB-Schritte nachgezogen (04.07.2026, gleiche Session):** MCP kam später zurück → Migration `m4_conversations_messages` via `apply_migration` angewendet, `get_advisors` sauber (nur die 2 bekannten WARNs; `handle_new_message` erscheint dank fehlendem Execute-Grant nicht). Voller Browser-E2E verifiziert: Lena startet Konversation über den Kontakt-CTA am NordSport-Listing (Redirect in den Chat), sendet per UI; NordSport-Antwort per SQL erschien **live via Realtime** (<0,5 s, ohne Reload) und wurde vom offenen Chat automatisch gelesen markiert; Ungelesen-Badge im Header (Lena „1" → nach Öffnen weg via router.refresh) und Ungelesen-Zähler + Zeitstempel in der Liste geprüft; Gegenseite als NordSport eingeloggt (Badge „1", Öffnen markiert gelesen, Antwort per UI). DB-Konsistenz: 5 Nachrichten/5 Notifications, je genau 1 ungelesen (Lenas noch nicht geöffnete letzte Antwort). Hinweis: Realtime-Subscription braucht ~1–2 s nach Seitenlade bis sie aktiv ist — Inserts unmittelbar nach Navigation können verpasst werden (nur E2E-Timing, kein Produktproblem, da Verlauf server-seitig geladen wird).
**Offen (nach M4):** Notifications-Anzeige bleibt minimal (Badge = ungelesene Nachrichten; Notification-Center + E-Mail in M7). Restliche 7 Seed-Profile (Rate-Limit). „Deal vorschlagen"-Aktion im Chat folgt in M5.

---

## 1. Architektur-Überblick

```
Browser (Next.js App Router, React Server Components)
   │
   ├── Supabase JS Client (Auth, DB-Queries via RLS, Realtime, Storage)
   │
   ├── Next.js Route Handlers / Server Actions
   │      ├── Stripe Connect (Checkout, Webhooks, Transfers)
   │      ├── E-Mail-Versand (Resend o.ä.) für Benachrichtigungen
   │      └── privilegierte Operationen (Service-Role-Key, nur serverseitig)
   │
   └── Supabase (Postgres + RLS, Auth, Storage, Realtime)
```

Grundprinzipien:
- **RLS-first:** Jede Tabelle hat Row Level Security. Der Client spricht direkt mit Supabase; nur dort, wo erhöhte Rechte nötig sind (Stripe-Webhooks, Admin-Aktionen, Auszahlungen), laufen Server Actions / Route Handler mit Service-Role-Key.
- **Stripe als Source of Truth fürs Geld:** Die `payments`-Tabelle spiegelt Stripe-Status via Webhooks. Kein Geldfluss-Status wird clientseitig gesetzt.
- **Zustandsmaschine für Deals:** Deal-Status-Übergänge nur über geprüfte Server-Logik (Postgres-Funktionen / Server Actions), nicht über freie Updates.
- **i18n von Anfang an:** Alle UI-Texte über `next-intl` mit `de` als Default-Locale; `en` später ergänzbar.

---

## 2. Ordnerstruktur

```
sponsormatch/
├── app/
│   ├── (marketing)/                  # öffentlich, ohne Login
│   │   ├── page.tsx                  # Landingpage
│   │   ├── impressum/page.tsx        # TODO: rechtlich prüfen
│   │   ├── datenschutz/page.tsx      # TODO: rechtlich prüfen
│   │   ├── agb/page.tsx              # TODO: rechtlich prüfen
│   │   └── widerruf/page.tsx         # TODO: rechtlich prüfen
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── registrieren/page.tsx     # inkl. Rollenwahl
│   │   └── auth/callback/route.ts    # E-Mail-Verifizierung / OAuth-Callback
│   ├── (app)/                        # eingeloggter Bereich, Layout mit Navi
│   │   ├── onboarding/page.tsx       # rollenspezifischer Profil-Wizard
│   │   ├── dashboard/page.tsx        # rollenabhängig (Sponsor / Gesponserter)
│   │   ├── suche/page.tsx            # Such- & Filtersystem + Matching
│   │   ├── profil/
│   │   │   ├── [id]/page.tsx         # öffentliches Profil
│   │   │   └── bearbeiten/page.tsx
│   │   ├── listings/
│   │   │   ├── page.tsx              # Übersicht (eigene + Marktplatz)
│   │   │   ├── neu/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── nachrichten/
│   │   │   ├── page.tsx              # Konversationsliste
│   │   │   └── [conversationId]/page.tsx
│   │   ├── deals/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx         # Workflow: Angebot→Vertrag→Zahlung→Abschluss→Bewertung
│   │   ├── analytics/page.tsx
│   │   └── einstellungen/
│   │       ├── page.tsx              # Konto, Benachrichtigungen
│   │       ├── verifizierung/page.tsx
│   │       └── daten/page.tsx        # DSGVO: Export & Löschung
│   ├── admin/                        # eigenes Layout, nur Rolle admin
│   │   ├── page.tsx                  # Übersicht / KPIs
│   │   ├── nutzer/page.tsx
│   │   ├── verifizierungen/page.tsx
│   │   ├── deals/page.tsx
│   │   ├── streitfaelle/page.tsx
│   │   └── provisionen/page.tsx
│   └── api/
│       ├── stripe/webhook/route.ts
│       └── cron/...                  # z.B. Auszahlungs-Freigaben, Erinnerungen
├── components/
│   ├── ui/                           # shadcn/ui-Komponenten
│   ├── profile/ listings/ deals/ messages/ admin/ ...
│   └── consent/CookieBanner.tsx      # TODO: rechtlich prüfen
├── lib/
│   ├── supabase/                     # Client-Factories (browser, server, admin)
│   ├── stripe/                       # Stripe-Client, Provisions-/Escrow-Logik
│   ├── matching/                     # regelbasiertes Scoring (austauschbar für ML)
│   ├── i18n/                         # next-intl Konfiguration
│   └── validation/                   # zod-Schemas (geteilt Client/Server)
├── messages/
│   ├── de.json
│   └── en.json                       # Platzhalter
├── supabase/
│   ├── migrations/                   # SQL-Migrationen inkl. RLS-Policies
│   ├── seed.sql                      # Beispieldaten (fiktive Nutzer/Listings)
│   └── functions/                    # Edge Functions, falls nötig
├── tests/                            # Vitest: Matching, Provisionsberechnung, Deal-Statusmaschine
├── .env.example
├── README.md
└── PLAN.md
```

---

## 3. Datenmodell

Alle Tabellen: `id uuid PK default gen_random_uuid()`, `created_at`, `updated_at`. RLS auf **allen** Tabellen aktiv.

| Tabelle | Wichtige Spalten | Zweck / Anmerkungen |
|---|---|---|
| **users** (Supabase `auth.users`) | E-Mail, verifiziert | Von Supabase verwaltet; keine eigene Tabelle. |
| **profiles** | `user_id FK→auth.users (unique)`, `role` (`sponsor` \| `sponsee` \| `admin`), `display_name`, `slug`, `avatar_url`, `bio`, `region` (Enum: DE-Bundesländer, AT, CH), `website`, `onboarding_completed`, `is_verified`, `deleted_at` | Basisprofil aller Nutzer. Soft-Delete für DSGVO-Löschworkflow. |
| **sponsor_profiles** | `profile_id FK`, `company_name`, `industry FK→categories`, `company_size`, `budget_min/max` (Cent), `target_audience jsonb`, `vat_id` | Rollenspezifische Erweiterung Sponsor. |
| **sponsee_profiles** | `profile_id FK`, `type` (`athlete` \| `club` \| `creator`), `category FK→categories`, `reach_total`, `audience jsonb` (Alter, Geschlecht, Interessen), `social_links jsonb`, `media_kit_url` (Storage), `past_sponsors text[]`, `price_range_min/max` | Rollenspezifische Erweiterung Gesponserter. |
| **categories** | `name`, `slug`, `kind` (`sport` \| `industry` \| `creator_niche`), `parent_id` (Hierarchie) | Gemeinsame Taxonomie für Suche & Matching. |
| **listings** | `author_profile_id FK`, `direction` (`seeking_sponsor` \| `offering_sponsorship`), `title`, `description`, `category_id FK`, `region`, `budget_min/max` (Cent), `reach_required`, `status` (`draft` \| `active` \| `paused` \| `closed`), `expires_at` | Ausschreibungen beider Seiten. |
| **conversations** | `listing_id FK nullable`, `sponsor_profile_id FK`, `sponsee_profile_id FK`, unique auf Paar+Listing | Klammer für Nachrichten; Deal kann daraus entstehen. |
| **messages** | `conversation_id FK`, `sender_profile_id FK`, `body`, `read_at` | Realtime via Supabase. |
| **deals** | `conversation_id FK`, `listing_id FK nullable`, `sponsor_profile_id FK`, `sponsee_profile_id FK`, `title`, `description`, `amount_total` (Cent), `currency` (default `eur`), `commission_pct` (zum Deal-Zeitpunkt eingefroren), `commission_amount` (Cent, berechnet), `status` (siehe Statusmaschine), `cancelled_reason` | Kernobjekt. Statuswechsel nur über Postgres-Funktion `advance_deal_status()`. |
| **deal_milestones** | `deal_id FK`, `title`, `due_date`, `amount` (Cent), `status` (`pending` \| `submitted` \| `approved` \| `paid` \| `disputed`), `proof_url` | Meilenstein-basierte Auszahlung (Escrow-Freigabe). |
| **contracts** | `deal_id FK (unique)`, `template_version`, `content jsonb` (ausgefüllte Vorlage), `sponsor_accepted_at`, `sponsee_accepted_at`, `pdf_url` | Digitale Zustimmung beider Seiten. // TODO: rechtlich prüfen (Vorlage + Wirksamkeit der Zustimmung) |
| **payments** | `deal_id FK`, `milestone_id FK nullable`, `stripe_payment_intent_id`, `stripe_transfer_id`, `amount`, `commission_amount`, `payout_amount`, `status` (`pending` \| `held_in_escrow` \| `released` \| `refunded` \| `failed`), `released_at` | Spiegel der Stripe-Objekte; nur via Webhook/Server beschreibbar. |
| **stripe_accounts** | `profile_id FK (unique)`, `stripe_account_id`, `onboarding_completed`, `payouts_enabled` | Connect-Konten der Gesponserten (und ggf. Sponsoren als Customer). |
| **reviews** | `deal_id FK`, `author_profile_id`, `target_profile_id`, `rating` (1–5), `comment`, unique (`deal_id`,`author_profile_id`) | Nur nach Deal-Status `completed`; beidseitig. |
| **verifications** | `profile_id FK`, `type` (`identity` \| `club_proof` \| `business`), `document_url` (Storage, privat), `status` (`pending` \| `approved` \| `rejected`), `reviewed_by FK`, `note` | Admin-Workflow → setzt `profiles.is_verified`. |
| **disputes** | `deal_id FK`, `opened_by_profile_id`, `reason`, `status` (`open` \| `under_review` \| `resolved_sponsor` \| `resolved_sponsee` \| `closed`), `resolution_note`, `resolved_by FK` | Streitfälle; blockiert Auszahlung des betroffenen Meilensteins. |
| **notifications** | `profile_id FK`, `type`, `payload jsonb`, `read_at`, `emailed_at` | In-App + E-Mail-Trigger. |
| **profile_views** | `profile_id FK`, `viewer_profile_id nullable`, `viewed_at` | Für Analytics (aggregiert anzeigen, DSGVO-sparsam). |
| **consents** | `profile_id FK`, `type` (`terms` \| `privacy` \| `marketing` \| `cookies`), `version`, `granted_at`, `revoked_at` | DSGVO-Einwilligungsnachweis. |
| **admin_audit_log** | `admin_profile_id FK`, `action`, `target_table`, `target_id`, `diff jsonb` | Jede Admin-Aktion wird protokolliert. Insert-only. |
| **platform_settings** | `key`, `value jsonb` | z.B. `commission_pct` konfigurierbar, ohne Deploy. |

### Deal-Statusmaschine

```
draft → offered → negotiating → agreed (Vertrag von beiden akzeptiert)
      → funded (Zahlung im Escrow) → in_progress → completed (alle Meilensteine freigegeben)
Seitenpfade: declined, cancelled, disputed (aus funded/in_progress)
```

### RLS-Grundsätze
- `profiles`, `listings` (status `active`), `reviews`: lesbar für eingeloggte Nutzer (Marktplatz); schreibbar nur vom Eigentümer.
- `conversations`/`messages`/`deals`/`contracts`/`milestones`: nur die beiden Beteiligten.
- `payments`, `verifications` (Dokumente), `disputes`: Beteiligte lesen, schreiben nur Server/Admin.
- `admin_audit_log`, `platform_settings`: nur Admin (Settings: lesbar für Server).
- Admin-Zugriff über `role = 'admin'`-Check in Security-Definer-Funktion (kein JWT-Claim-Hack).
- Storage-Buckets: `avatars` (public), `media-kits` (eingeloggt lesbar), `verification-docs` & `contracts` (privat, nur Beteiligte/Admin).

---

## 4. Seiten & Routen

| Route | Zugriff | Inhalt |
|---|---|---|
| `/` | öffentlich | Landingpage mit Wertversprechen je Rolle, CTA |
| `/impressum`, `/datenschutz`, `/agb`, `/widerruf` | öffentlich | Rechtsseiten (Platzhalter, // TODO: rechtlich prüfen) |
| `/registrieren`, `/login` | öffentlich | Auth mit Rollenwahl, E-Mail-Verifizierung |
| `/onboarding` | eingeloggt | Mehrstufiger Wizard je Rolle (Profil, Kategorie, Region, Mediakit) |
| `/dashboard` | eingeloggt | Rollenspezifisch: KPIs, offene Anfragen, Deal-Status |
| `/suche` | eingeloggt | Filter (Branche, Budget, Region, Reichweite, Zielgruppe) + Match-Score |
| `/profil/[id]` | eingeloggt | Öffentliches Profil mit Badge, Reviews, Listings, Kontakt-CTA |
| `/profil/bearbeiten` | eingeloggt | Profilpflege, Mediakit-Upload, Social-Links |
| `/listings`, `/listings/neu`, `/listings/[id]` | eingeloggt | Ausschreibungen erstellen & durchsuchen |
| `/nachrichten`, `/nachrichten/[id]` | eingeloggt | Realtime-Chat, „Deal vorschlagen“-Aktion |
| `/deals`, `/deals/[id]` | Beteiligte | Kompletter Workflow inkl. Vertrag, Zahlung, Meilensteine, Bewertung |
| `/analytics` | eingeloggt | Profilaufrufe, Anfragen, Abschlussquote, Umsatz/Provision |
| `/einstellungen`, `/einstellungen/verifizierung`, `/einstellungen/daten` | eingeloggt | Konto, Verifizierung, DSGVO-Export/-Löschung |
| `/admin/*` | nur Admin | Nutzer, Verifizierungen, Deals, Streitfälle, Provisionsreport |
| `/api/stripe/webhook` | Stripe | PaymentIntent-/Transfer-/Account-Events |

---

## 5. Meilensteine (Baureihenfolge)

Jeder Meilenstein endet mit lauffähigem, getestetem Stand + Commit(s).

**M0 — Fundament (Setup)**
Next.js + TypeScript + Tailwind + shadcn/ui, next-intl (de), Supabase-Projekt + CLI, `.env.example`, README, CI-fähige Test-Infrastruktur (Vitest), Basis-Layout, Cookie-Banner-Platzhalter, Rechtsseiten-Platzhalter.

**M1 — Auth & Rollen**
Registrierung mit Rollenwahl, E-Mail-Verifizierung, Login/Logout, `profiles`-Tabelle + RLS, geschützte Layouts, Consent-Erfassung (AGB/Datenschutz bei Registrierung).

**M2 — Profile & Onboarding**
Rollenspezifische Profiltabellen + Wizard, Mediakit-Upload (Storage + Policies), öffentliche Profilseite, `categories`-Seed.

**M3 — Suche, Listings & Matching v1**
Listings-CRUD, Such-/Filterseite, regelbasiertes Scoring in `lib/matching/` (gewichtete Kriterien: Branche, Budget-Überlappung, Region, Reichweite, Zielgruppe) — mit Unit-Tests, Interface so geschnitten, dass später ein ML-Scorer dieselbe Signatur bedient.

**M4 — Nachrichten (Realtime)**
Konversationen + Chat via Supabase Realtime, Ungelesen-Zähler, In-App-Notifications-Grundgerüst.

**M5 — Deal-Workflow & Verträge**
Deals-Statusmaschine (Postgres-Funktion + Tests), Angebot/Verhandlung aus Chat heraus, Vertragsvorlage mit beidseitiger digitaler Zustimmung, Meilenstein-Definition.

**M6 — Zahlungen (Stripe Connect, Escrow)**
Connect-Onboarding für Gesponserte, Zahlung des Sponsors (PaymentIntent), Einbehalt im Escrow, Provisionsberechnung (konfigurierbar via `platform_settings`, mit Tests), Freigabe je Meilenstein → Transfer an Gesponserten, Webhook-Verarbeitung, `payments`-Spiegelung. Steuerhinweis-Texte. // TODO: rechtlich prüfen (Zahlungsdienste-Regulatorik, s. Rückfrage 2)

**M7 — Bewertungen, Verifizierung, Benachrichtigungen**
Beidseitige Reviews nach Abschluss, Verifizierungs-Workflow + Badge, E-Mail-Benachrichtigungen (Resend), Notification-Center.

**M8 — Analytics & Admin-Panel**
Rollen-Dashboards (Profilaufrufe, Anfragen, Deals, Umsatz), Admin: Nutzer/Deals/Streitfälle/Provisionsreport, Audit-Log.

**M9 — DSGVO-Feinschliff & Launch-Härtung**
Datenexport/-löschung, Cookie-Consent funktional, a11y-Pass, Fehler-/Ladezustände, Seed-Skript final, Vercel-Deployment, Lasttest der RLS-Policies (Security-Review).

---

## 6. Getroffene Entscheidungen (10.06.2026)

1. **Provisionsmodell:** Abzug vom Gesponserten. Sponsor zahlt die Deal-Summe, die Plattform behält `commission_pct` (konfigurierbar via `platform_settings`), der Rest geht an den Gesponserten. Abbildung in Stripe über die Plattform-Balance (s. Punkt 2), `commission_pct` wird pro Deal eingefroren.
2. **Escrow:** Stripe **Separate Charges & Transfers**. Der Sponsor zahlt per PaymentIntent an die Plattform; bei Meilenstein-Freigabe erfolgt ein Transfer (`amount − Provision anteilig`) an das Connect-Konto des Gesponserten. Stripe ist der regulierte Zahlungsdienstleister. // TODO: rechtlich prüfen (ZAG-/Plattform-Konstellation vom Anwalt bestätigen lassen)
3. **Scope:** Voller Plan M0–M9 vor Launch, in der angegebenen Reihenfolge.
4. **Verifizierung:** Manuell durch Admin — Dokument-Upload (Ausweis / Vereinsregister / Handelsregister) in privaten Storage-Bucket, Prüfung im Admin-Panel, Badge via `profiles.is_verified`. Stripe Identity als mögliche spätere Automatisierung.
