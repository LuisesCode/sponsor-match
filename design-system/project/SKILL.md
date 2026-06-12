---
name: sponsormatch-design
description: Use this skill to generate well-branded interfaces and assets for SponsorMatch (the two-sided sponsorship marketplace), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Quick reference:
- Global CSS entry: `styles.css` (link this one file). Tokens live in `tokens/`.
- Components are bundled to `window.SponsorMatchDesignSystem_a1f0e8` via `_ds_bundle.js` (needs React UMD + Babel).
- Icons: Lucide via CDN (`https://unpkg.com/lucide@latest`).
- Brand: Navy `#1B3A6B` (trust) + Teal `#16B486` (deals/verified) + Orange `#FF6B35` (energy, sparingly). Display = Archivo, Body = Manrope, Mono = JetBrains Mono. German Du-form copy, no emoji.
- Dark mode: `data-theme="dark"` on any ancestor.
