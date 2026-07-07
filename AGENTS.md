<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# SponsorMatch — Projektkonventionen

Zweiseitiger Sponsoring-Marktplatz (DACH): Sponsoren ↔ Gesponserte (Sportler, Vereine, Creator). Next.js (App Router, TypeScript) + Supabase (Postgres/RLS, Auth, Storage, Realtime). Monetarisierung: Provision pro Deal, Escrow via Stripe Connect (ab M6).

**Zuerst lesen:** `PLAN.md` (Status-Block oben = aktueller Stand + offene Punkte je Meilenstein) und `design-system/project/readme.md` (Design-Guide). Beides ist die Quelle der Wahrheit — dieser Block hier ist nur die Kurzfassung.

## Architektur-Grundsätze

- **RLS-first:** Jede Tabelle hat Row Level Security; der Client spricht direkt mit Supabase. Kein Service-Role-Key im Projekt (weder in `.env.local` noch im Code).
- **Statusmaschinen in der DB:** Deal-Statuswechsel u. Ä. laufen NUR über geprüfte SECURITY-DEFINER-Funktionen (`create_deal`, `counter_deal_offer`, `accept_contract`, `advance_deal_status`) — keine freien Inserts/Updates auf `deals`/`deal_milestones`/`contracts` (authenticated hat dort nur SELECT). Neue Schreibpfade genauso bauen: Funktion + `revoke`/`grant execute`, RLS restriktiv.
- **Provision:** `commission_pct` kommt aus `platform_settings` und wird beim Deal-Anlegen eingefroren; Abzug vom Gesponserten. TS-Spiegel in `lib/deals/commission.ts` muss identisch zum SQL runden (Basispunkte, round half away from zero).
- **Chats sind privat:** conversations/messages bewusst OHNE Admin-Zugriff.
- Geldbeträge immer in **Cent** (bigint/integer in DB, `number` in TS), Formularerfassung in Euro → `euroToCents`.

## Code-Konventionen

- `lib/supabase/`: Client-Factories (`browser.ts`, `server.ts`), `types.ts` wird **manuell** gepflegt — bei jeder Migration die Row-/Insert-/Update-/Functions-Typen nachziehen.
- `lib/validation/`: zod **v4** (`z.flattenError`, `z.iso.date`, `z.uuid`), Fehlermeldungen deutsch in Du-Form.
- Server-Action-Muster: `actions.ts` (`"use server"`) + `form-state.ts` + Client-Komponente mit `useActionState` — Vorbilder in `app/(app)/listings/`, `app/(app)/nachrichten/`, `app/(app)/deals/`. Jede Action prüft zuerst `getCurrentProfile()` (Login/Onboarding), validiert mit zod, mappt DB-Fehler auf generische deutsche Meldungen (Ausnahme: `P0001`-raise-Meldungen sind nutzertauglich formuliert und dürfen durchgereicht werden).
- UI: Komponenten aus `components/ui/` (Button, Card, Badge, Input, Textarea, …), Styling per Inline-Styles mit CSS-Variablen aus `app/styles/tokens.css` (kein Tailwind-Klassen-Wildwuchs). Formatierung über `lib/format.ts` (`formatCents`, `formatDate`, `formatMessageTimestamp`, …).
- Tests: Vitest in `tests/` (Spiegelstruktur zu `lib/`). Reine Logik (Provision, Statusmodell, Validierung, Templates) bekommt immer Tests.

## Design & Copy (Kurzfassung des Guides)

- Deutsch, **Du-Form**, selbstbewusst aber nicht marktschreierisch; Vertrauen explizit benennen („sicher im Escrow“).
- Farben: Navy (primär), Teal (Erfolg/Deals/Verifiziert), Orange (sparsam, Energie). **Keine Emoji** im Produkt-UI.
- **Alle Kennzahlen/Beträge in Mono** (`var(--font-mono)`), deutsches Zahlenformat (`€4.250`, `4,9`, `128K`).
- Headlines Archivo (800–900, `letter-spacing -0.03em`), Eyebrows uppercase + `0.12em`.
- Rechtstexte/Vertragsvorlagen: `// TODO: rechtlich prüfen` stehen lassen.

## Supabase-Workflow

- Projekt „SponsorMatch“ (`ckcmwmehzusgyzwbfqvd`, eu-central-1). Zugriff NUR über den Supabase-MCP-Server — kein CLI-Login, kein Service-Role-Key. Der MCP ist nicht in jeder Session verbunden und kann mitten in der Session auftauchen; per ToolSearch prüfen (Tool-Präfix trägt eine Session-UUID, nicht `mcp__supabase__` — nach `apply_migration` o. Ä. suchen).
- Migrationen: via `apply_migration` anwenden **UND** als Datei unter `supabase/migrations/` einchecken (identischer Inhalt). Danach `get_advisors` (security) prüfen. Bekannte/akzeptierte WARNs: SECURITY-DEFINER-Funktionen für authenticated (gewollt: `is_admin`, Deal-Funktionen, `get_commission_pct`) und Leaked-Password-Protection (Dashboard-Einstellung).
- Seed-Stand und Testnutzer: siehe PLAN.md-Statusblöcke. Testnutzer `luisemeier15+sm-test1@gmail.com` (Sponsee „Lena Testfuchs“) und `+sm-test2` (Sponsor „NordSport Test GmbH“), Passwort `SmTest!2026`.

## Qualität & Abschluss eines Arbeitspakets

1. `npx vitest run`, `npx eslint .`, `npm run build` — alles grün, bevor ein Meilenstein als fertig gilt.
2. Browser-E2E mit den Preview-Tools gegen die Live-DB (Buttons per Textinhalt klicken, nicht `button[type=submit]` — der trifft zuerst „Abmelden“). In frischen Worktrees: `.env.local` + `.claude/launch.json` aus dem Hauptrepo kopieren, `npm install` im Root **und** in `react-demo-app/` (sonst bricht der Next-Typecheck).
3. Commits pro Teilschritt, Conventional Commits mit deutscher Beschreibung.
4. Am Ende: Status-Block in `PLAN.md` ergänzen (was umgesetzt, was verifiziert, was offen) — dieses Ritual ist die Gedächtnisbrücke zwischen Sessions.
