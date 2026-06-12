# SponsorMatch — Design System

> Der zweiseitige Sponsoring-Marktplatz für den deutschsprachigen Raum. Dieses Design System bündelt Marke, Foundations, UI-Komponenten und High-Fidelity-Screens für **SponsorMatch**.

---

## 1 · Produkt- & Markenkontext

**SponsorMatch** verbindet **Sponsoren** (Firmen, Marken, Marketing-Teams) mit **Gesponserten** (Sportler, Vereine, Influencer/Creator). Das Geschäftsmodell ist eine **Provision pro vermitteltem Deal**; Zahlungen laufen über **Stripe-Connect-Escrow**, Verträge und Mehrwert entstehen **in-app**.

Die Marke muss zwei Welten verbinden:
- **Seriös & vertrauenswürdig** genug für Firmen-Marketingabteilungen (Budgets, Verträge, Rechtssicherheit).
- **Dynamisch & nahbar** genug für Sportler und Creator (Energie, Bewegung, Persönlichkeit).

Tonalität (vom Auftraggeber bestätigt): **ausgewogen 50/50 — seriös UND dynamisch.**

### Quellen
Dieses System wurde **from scratch** entworfen — es lag **kein Code-Repository und keine Figma-Datei** vor. Alle Foundations, Komponenten und Screens sind Originalentwürfe. Sollte später eine Codebase/Figma dazukommen, hier verlinken und Foundations damit abgleichen.

---

## 2 · Content-Fundamentals (Copy & Ton)

- **Sprache:** Deutsch (Du-Form). Wir sprechen den Nutzer direkt und partnerschaftlich an: *„Finde deinen Match"*, *„Erreiche die richtige Zielgruppe"*. Kein steifes „Sie", aber auch kein Slang.
- **Stimme:** selbstbewusst, klar, motivierend — nie marktschreierisch. Verben der Bewegung & des Zusammenkommens: *matchen, verbinden, starten, wachsen, abschließen*.
- **Casing:** Headlines im normalen Satz-/Titelfall (kein ALL-CAPS außer Eyebrows/Overlines, die in `letter-spacing: 0.12em` und Großbuchstaben gesetzt werden). Buttons in Satzfall: *„Profil ansehen"*, nicht *„PROFIL ANSEHEN"*.
- **Zahlen:** deutsches Format — Dezimalkomma (`4,9`), Tausenderpunkt (`€4.250`), Reichweiten gekürzt (`128K`, `1,2 Mio`). Beträge immer mit `€`-Präfix und in Mono-Schrift.
- **Vertrauen first:** Copy benennt Sicherheit explizit — *„sicher im Escrow"*, *„Identität geprüft"*, *„Zahlung erst nach Freigabe"*. Trust ist Teil des Textes, nicht nur der UI.
- **Emoji:** **keine** im Produkt-UI. Energie entsteht über Farbe, Typo und Bewegung, nicht über Emoji.
- **Beispiele:**
  - Hero: „Sponsoring, das wirklich passt."
  - Sub: „Verifizierte Sportler & Creator treffen auf Marken mit Budget — sicher abgewickelt per Escrow."
  - CTA Sponsor: „Talente entdecken" · CTA Creator: „Profil erstellen"
  - Leerzustand: „Noch keine Matches — verfeinere deine Filter oder erweitere die Region."

---

## 3 · Visuelle Foundations

### Farbe
- **Primär — Navy `#1B3A6B` (navy-600):** Vertrauen, Seriosität, Business. Trägt Header, Primär-Buttons, Markenflächen.
- **Akzent 1 — Teal `#16B486` (teal-500):** Wachstum, Deals, Geld/Escrow, Erfolg & **Verifiziert**-Badge. Die „positive Bestätigung"-Farbe.
- **Akzent 2 — Orange `#FF6B35` (orange-500):** Energie, Sport, Bewegung. **Sparsam** als Highlight/Sekundär-CTA — nie als Flächenfarbe.
- **Neutrale — kühle Slate-Töne** (leicht blaustichig, harmonieren mit Navy). Text = `gray-900`, Muted = `gray-500`, Rahmen = `gray-200`, App-Hintergrund = `gray-50`.
- **Begründung:** Navy + Teal liefern *Vertrauen* (Banken-/Fintech-Assoziation), Orange liefert *Energie* (Sport). Die Kombination ist genau die geforderte 50/50-Balance.

### Typografie
- **Display/Headings — Archivo** (800–900, eng `-0.03em`): markant, sportlich, „grotesk mit Haltung". Trägt alle Headlines.
- **Body — Manrope** (400–700): freundlich, neutral, hoch lesbar, Zeilenhöhe 1.7 im Fließtext.
- **Mono — JetBrains Mono** (700): **alle Kennzahlen** — Beträge, Reichweite, Bewertungen, Match-Scores. Gibt Daten Glaubwürdigkeit.
- Eyebrows/Overlines: Archivo 700, 11px, `0.12em`, uppercase, in Teal.

### Form, Tiefe & Bewegung
- **Ecken:** durchgehend abgerundet (shadcn-Stil). Karten `--radius-xl` (20px), Controls `--radius-md` (10px), Pills/Badges `--radius-pill`.
- **Schatten:** sanft und **navy-getönt** (`rgba(12,26,51,…)`), nie hartes Schwarz. Karten ruhen auf `--shadow-sm`, heben bei Hover auf `--shadow-lg`. Farbige Elevation (`--shadow-brand` / `--shadow-energy`) nur für Primär-CTAs.
- **Rahmen:** 1px `--border` auf Karten/Inputs; 1.5px bei Controls für Präzision. Fokus = 3px weicher Ring (`--focus-ring`) in Navy.
- **Hover:** Flächen werden eine Stufe dunkler/heller (`--*-hover`), Karten heben sich um −3px. **Press:** leichtes `scale(0.98–0.99)` + 1px Versatz — taktil, kein hartes Klacken.
- **Bewegung:** schnell und ruhig — `--dur-fast 120ms` für Controls, `--dur-med 200ms` für Karten/Overlays, Easing `cubic-bezier(0.22,1,0.36,1)` (sanftes Ausschwingen). **Keine** Dauer-Loops, kein Bounce, kein Parallax.
- **Hintergründe:** überwiegend flächig (`--bg`/`--surface`). Ein einziger Marken-Gradient ist erlaubt: **navy→teal**, diagonal — für Hero-Flächen und MatchCard-Cover ohne Bild. **Keine** lila/violetten Verläufe, keine Texturen, keine wilden Mesh-Gradienten.
- **Transparenz & Blur:** nur bei Overlays/Dialogen (`backdrop-filter: blur(3px)` + `--overlay`) und gelegentlichen Glas-Chips auf Bildern.
- **Bild-Vibe:** echte, warme Sport-/Lifestyle-Fotografie mit Menschen in Bewegung; voll-bleed in Heroes, gerundet in Karten. (Platzhalter via `<image-slot>` / `picsum` bis echte Assets vorliegen.)

---

## 4 · Iconographie

- **System:** **Lucide** (Outline, Strichstärke 2) — passt zur sportlich-klaren, modernen Anmutung. Eingebunden per CDN: `<script src="https://unpkg.com/lucide@latest"></script>`.
- **Wrapper-Komponente:** `Icon` (`components/forms/Icon.jsx`) — `<Icon name="shield-check" size={20} />`. Trust-relevante Glyphen (Häkchen, Schloss, Stern) sind in `VerifiedBadge` / `RatingStars` **direkt als Inline-SVG** eingebaut, damit sie ohne CDN funktionieren.
- **Häufige Namen:** `search`, `shield-check`, `lock`, `star`, `message-circle`, `bar-chart-3`, `users`, `wallet`, `arrow-right`, `check`, `map-pin`, `heart`, `bell`.
- **Emoji:** werden **nicht** als Icons verwendet. Keine Unicode-Glyphen als Ersatz für echte Icons.
- **Substitutions-Hinweis:** Lucide wird per CDN geladen (kein Code-Repo vorhanden). Falls ein eigenes Icon-Set gewünscht ist, bitte Dateien nachreichen.

---

## 5 · Index / Manifest

**Foundations & Entry**
- `styles.css` — globaler Einstiegspunkt (nur `@import`). **Dies eine Datei** einbinden.
- `tokens/` — `fonts.css`, `colors.css` (Light + Dark), `typography.css`, `spacing.css`, `shadows.css`, `base.css`.
- `guidelines/*.html` — Specimen-Karten (Colors, Type, Spacing, Brand) für den Design-System-Tab.
- `assets/` — `logo-mark.svg`, `logo-wordmark.svg`, `logo-wordmark-dark.svg`.

**Komponenten** (`window.SponsorMatchDesignSystem_a1f0e8`)
- `components/forms/` — Button, IconButton, Input, Select, Checkbox, Radio/RadioGroup, Switch, Icon
- `components/feedback/` — Badge, VerifiedBadge, RatingStars, Toast, Tooltip, Dialog
- `components/data/` — Card, Avatar, Tag, Tabs, StatBlock, **MatchCard**

**UI-Kits**
- `ui_kits/marketing/` — Landingpage (Hero, So funktioniert's, Social Proof, Doppel-CTA) + Hero-Varianten
- `ui_kits/app/` — Onboarding (Rollenwahl), Profil (Gesponserter), Entdecken (Filter + Matches), Deal/Nachrichten, Dashboard (Analytics)

**Dark Mode:** über `data-theme="dark"` (oder Klasse `.dark`) auf einem beliebigen Vorfahren — alle Token und Komponenten sind voll ausgearbeitet.

---

## 6 · Verwendung

```html
<link rel="stylesheet" href="styles.css">
<script src="https://unpkg.com/lucide@latest"></script>
<!-- React UMD + Babel, dann: -->
<script src="_ds_bundle.js"></script>
<script type="text/babel">
  const { Button, MatchCard } = window.SponsorMatchDesignSystem_a1f0e8;
</script>
```

Dark Mode aktivieren: `<html data-theme="dark">`.
