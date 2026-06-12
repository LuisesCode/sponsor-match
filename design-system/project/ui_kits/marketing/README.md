# UI Kit · Marketing

Die öffentliche **Landingpage** von SponsorMatch.

- `index.html` — komponiert alle Sektionen, lädt `_ds_bundle.js` + Lucide, mit Light/Dark-Umschalter und Hero-Varianten-Umschalter.
- `sections.jsx` — `SiteNav`, `Hero`, `HowItWorks`, `ProofBar`, `Testimonials`, `DualCTA`, `SiteFooter` (Export nach `window`).

Sektionen der Seite: **Hero** (Headline + Doppel-CTA für beide Seiten + Trust-Zeile), **So funktioniert's** (3 Schritte), **Social Proof** (Kennzahlen + Bewertungen), **Doppel-CTA** (Sponsor vs. Gesponserter), **Footer**.

Bilder: bewusst ohne externe Foto-Assets — Cover/Hero nutzen den Marken-Gradient (navy→teal), Personen werden über Initialen-Avatare dargestellt. Echte Fotografie kann später via `<image-slot>` ergänzt werden.
