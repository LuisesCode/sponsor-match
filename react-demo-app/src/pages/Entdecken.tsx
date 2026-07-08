import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { SiteNav, SiteFooter } from "@/components/marketing/sections";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MatchCard } from "@/components/ui/MatchCard";
import { useSession } from "@/auth/SessionContext";
import { getDb } from "@/db/client";
import { getPublicProfileTeasers, type DiscoverFilters, type PublicProfileTeaser } from "@/db/repositories/discover";

function toggleTheme() {
  const isDark = document.documentElement.dataset.theme === "dark";
  if (isDark) {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = "dark";
  }
  try {
    window.localStorage.setItem("fk-theme", isDark ? "light" : "dark");
  } catch {
    // localStorage nicht verfügbar (z.B. Privatmodus) — Theme gilt dann nur für die Sitzung
  }
}

const TABS: { value: DiscoverFilters["role"]; label: string }[] = [
  { value: null, label: "Alle" },
  { value: "sponsor", label: "Sponsoren" },
  { value: "sponsee", label: "Gesponserte" },
];

/**
 * Öffentlicher Entdecken-Bereich — auch ohne Login erreichbar (Marketing-
 * Funnel). Zeigt nur Basisangaben je Profil; volle Details (Bio, Preise,
 * Kontakt) gibt's erst nach der Registrierung auf /profil/:slug.
 */
export default function Entdecken() {
  const { profile } = useSession();
  const navigate = useNavigate();
  const [tab, setTab] = React.useState<DiscoverFilters["role"]>(null);
  const [query, setQuery] = React.useState("");
  const [items, setItems] = React.useState<PublicProfileTeaser[]>([]);

  const load = React.useCallback(async () => {
    const db = await getDb();
    setItems(getPublicProfileTeasers(db, { role: tab, query }));
  }, [tab, query]);

  React.useEffect(() => {
    void load();
  }, [load]);

  function handleView(slug: string) {
    if (profile) navigate(`/profil/${slug}`);
    else navigate("/registrieren");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <SiteNav onToggleTheme={toggleTheme} />
      <main style={{ flex: 1 }}>
        <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "56px var(--gutter) 88px", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <div style={{ maxWidth: 620 }}>
            <div className="fk-eyebrow">Entdecken</div>
            <h1 style={{ fontSize: "var(--fs-display-lg)", marginTop: 12, color: "var(--text)" }}>
              Schon mal reinschauen, wer auf Flenzko unterwegs ist
            </h1>
            <p style={{ marginTop: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
              Verifizierte Sportler, Vereine, Creator und Marken — frei durchsuchbar, ganz ohne Konto. Für
              vollständige Profile mit Reichweite, Preisen und Kontaktaufnahme brauchst du ein kostenloses Konto.
            </p>
          </div>

          <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8 }}>
              {TABS.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setTab(t.value)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "var(--radius-pill)",
                    border: `1.5px solid ${tab === t.value ? "var(--primary)" : "var(--border)"}`,
                    background: tab === t.value ? "var(--primary)" : "var(--surface)",
                    color: tab === t.value ? "var(--on-primary)" : "var(--text-muted)",
                    fontWeight: 600,
                    fontSize: "var(--fs-sm)",
                    cursor: "pointer",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <Input
              placeholder="Name, Kategorie oder Region …"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              wrapStyle={{ flex: "1 1 240px", marginBottom: 0 }}
            />
          </div>

          {items.length === 0 ? (
            <Card padding="lg">
              <p style={{ margin: 0, color: "var(--text-muted)" }}>Keine Profile gefunden — passe deine Suche an.</p>
            </Card>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "var(--space-5)" }}>
              {items.map((item) => (
                <MatchCard
                  key={item.slug}
                  name={item.name}
                  category={item.category}
                  location={item.location}
                  avatarSrc={item.avatarSrc}
                  verified={item.verified}
                  onView={() => handleView(item.slug)}
                />
              ))}
            </div>
          )}

          {!profile && (
            <Card padding="lg" style={{ background: "var(--surface-2)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--fs-lg)" }}>
                    Profildetails, Kontakt & Matching gibt's mit kostenlosem Konto
                  </h2>
                  <p style={{ margin: "var(--space-2) 0 0", color: "var(--text-muted)" }}>
                    Registrierung dauert unter zwei Minuten — danach siehst du Reichweite, Preise und kannst direkt
                    Kontakt aufnehmen.
                  </p>
                </div>
                <Link to="/registrieren">
                  <Button variant="primary" size="lg">
                    Kostenlos registrieren
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
