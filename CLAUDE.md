@AGENTS.md

## Befehle (im Projekt-Root, `sponsormatch/`)

- `npm run dev` — Next.js-Dev-Server
- `npm run build` — Production-Build (muss vor Abschluss eines Meilensteins grün sein, siehe AGENTS.md)
- `npm run lint` — ESLint (`eslint.config.mjs`)
- `npx vitest run` — alle Tests einmalig
- `npx vitest run tests/deals/status.test.ts` — einzelne Testdatei
- `npx vitest run -t "Teststring"` — einzelner Test nach Name
- `npx vitest` (ohne `run`) — Watch-Mode

## Repo-Layout: zwei getrennte npm-Projekte

- Root (`/`) — die eigentliche Next.js-App (App Router, siehe AGENTS.md). Quelle der Wahrheit für Produkt, DB-Schema und Design.
- `react-demo-app/` — separates Vite + React + TypeScript + React-Router-Scaffold, aktuell unangetastetes Boilerplate ohne SponsorMatch-Inhalte. Eigene `package.json`/Lint (`oxlint`) — Befehle dort per `npm --prefix react-demo-app run <script>` oder nach `cd react-demo-app`. Der Root-`tsconfig.json` schließt diesen Ordner explizit vom Next-Typecheck aus (`exclude`).
