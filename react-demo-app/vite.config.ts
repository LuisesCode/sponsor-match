import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages liefert Projekt-Seiten unter /<repo-name>/ aus. Bis das
  // Ziel-Repo feststeht, bleibt base "/"; vor dem Deploy (siehe PLAN/Phase 8)
  // auf "/<repo-name>/" setzen, z.B. via Umgebungsvariable im CI-Workflow.
  base: process.env.VITE_BASE_PATH ?? '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
