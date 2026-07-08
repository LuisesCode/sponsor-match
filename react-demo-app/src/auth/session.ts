const SESSION_KEY = "flenzko-session";

/** Aktuell angemeldetes Profil (nur die id) — kein Server, keine Cookies/JWT. */
export function getSessionProfileId(): string | null {
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function setSessionProfileId(profileId: string): void {
  try {
    window.localStorage.setItem(SESSION_KEY, profileId);
  } catch {
    // localStorage nicht verfügbar (z.B. Privatmodus) — Session gilt dann nur für die Sitzung
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignorieren
  }
}
