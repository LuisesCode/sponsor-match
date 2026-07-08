import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { getDb } from './db/client'

// sql.js so früh wie möglich initialisieren (WASM laden, IndexedDB restaurieren),
// damit Datenbank-Zugriffe in den Seiten nicht auf den ersten Request warten.
void getDb()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
