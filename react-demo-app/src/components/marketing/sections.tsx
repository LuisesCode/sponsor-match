import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { RatingStars } from "@/components/ui/RatingStars";
import { MatchCard } from "@/components/ui/MatchCard";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Logo } from "./Logo";

/**
 * Flenzko — Marketing-Sektionen der Landingpage.
 * Portiert aus dem Design-System-Handoff (ui_kits/marketing/sections.jsx).
 * Copy bewusst 1:1 übernommen (Deutsch, Du-Form, Trust-Sprache).
 */

/* ---------------------------------------------------------------- Nav */
export function SiteNav({ onToggleTheme }: { onToggleTheme: () => void }) {
  const links = ["So funktioniert’s", "Für Sponsoren", "Für Creator", "Preise"];
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "color-mix(in srgb, var(--surface) 86%, transparent)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--container)",
          margin: "0 auto",
          padding: "0 var(--gutter)",
          height: 72,
          display: "flex",
          alignItems: "center",
          gap: 28,
        }}
      >
        <a href="#" style={{ display: "inline-flex", alignItems: "center" }}>
          {/* Logo-Ton wird per CSS-Theme umgeschaltet (inline SVG, kein Asset-Pfad nötig) */}
          <Logo tone="navy" className="fk-light-only" />
          <Logo tone="white" className="fk-dark-only" />
        </a>
        <nav style={{ display: "flex", gap: 22, marginLeft: 12 }} className="fk-navlinks">
          {links.map((l) => (
            <a key={l} href="#" style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}>
              {l}
            </a>
          ))}
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onToggleTheme}
            aria-label="Farbschema umschalten"
            style={{
              width: 38,
              height: 38,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="moon" size={18} className="fk-light-only" />
            <Icon name="sun" size={18} className="fk-dark-only" />
          </button>
          <Button variant="ghost" size="sm" className="fk-hide-sm">
            Anmelden
          </Button>
          <Button variant="primary" size="sm">
            Kostenlos starten
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- Hero */
export function Hero() {
  return (
    <section style={{ position: "relative", overflow: "hidden" }}>
      <div
        style={{
          maxWidth: "var(--container)",
          margin: "0 auto",
          padding: "72px var(--gutter) 88px",
          display: "grid",
          gridTemplateColumns: "1.05fr 0.95fr",
          gap: 56,
          alignItems: "center",
        }}
        className="fk-hero-grid"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Badge tone="accent" style={{ alignSelf: "flex-start" }}>Der Sponsoring-Marktplatz für DACH</Badge>
          <h1 style={{ fontSize: "var(--fs-display-2xl)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.02, margin: 0, color: "var(--text)" }}>
            Sponsoring, das
            <br />
            <span style={{ color: "var(--accent)" }}>wirklich passt.</span>
          </h1>
          <p style={{ fontSize: "var(--fs-lg)", color: "var(--text-muted)", lineHeight: 1.6, margin: 0, maxWidth: 520 }}>
            Verifizierte Sportler, Vereine & Creator treffen auf Marken mit Budget — sicher abgewickelt per Escrow, Verträge inklusive.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button variant="primary" size="lg" iconRight={<Icon name="search" size={18} />}>
              Talente entdecken
            </Button>
            <Button variant="energy" size="lg">
              Als Creator starten
            </Button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", marginTop: 4 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: "var(--fs-sm)", color: "var(--text-muted)", fontWeight: 600 }}>
              <Icon name="shield-check" size={18} color="var(--secure)" /> Sichere Zahlung per Escrow
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: "var(--fs-sm)", color: "var(--text-muted)", fontWeight: 600 }}>
              <RatingStars value={4.9} size={15} /> 4,9 aus 2.100+ Deals
            </span>
          </div>
        </div>
        <div style={{ position: "relative", minHeight: 380 }}>
          <div
            style={{
              position: "absolute",
              inset: "-10% -6%",
              background:
                "radial-gradient(60% 60% at 70% 30%, color-mix(in srgb, var(--teal-500) 22%, transparent), transparent), radial-gradient(50% 50% at 20% 80%, color-mix(in srgb, var(--navy-500) 26%, transparent), transparent)",
              filter: "blur(8px)",
            }}
          />
          <div style={{ position: "relative" }}>
            <div style={{ maxWidth: 320, marginLeft: "auto" }}>
              <MatchCard
                name="Lena Fuchs"
                category="Fitness"
                location="München"
                verified
                matchScore={94}
                rating={4.9}
                ratingCount={128}
                priceFrom="€1.200"
                stats={[
                  { value: "128K", label: "Reichweite" },
                  { value: "7,2%", label: "Engmt." },
                  { value: "12", label: "Deals" },
                ]}
                tags={["Instagram", "TikTok"]}
              />
            </div>
            <div style={{ position: "absolute", bottom: -28, left: -8, width: 230 }}>
              <Card padding="sm" style={{ boxShadow: "var(--shadow-xl)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "var(--radius-md)",
                      background: "var(--success-soft)",
                      color: "var(--success)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name="shield-check" size={20} />
                  </span>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--fs-sm)" }}>Deal abgeschlossen</div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>€4.250 sicher im Escrow</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- How it works */
export function HowItWorks() {
  const steps = [
    { icon: "user-plus", t: "Profil erstellen", d: "Sportler & Creator zeigen Reichweite, Kategorie und Mediakit. Marken hinterlegen Ziele und Budget." },
    { icon: "search", t: "Matchen & verhandeln", d: "Intelligente Vorschläge bringen passende Partner zusammen. Konditionen direkt im Chat klären." },
    { icon: "shield-check", t: "Sicher abschließen", d: "Vertrag in-app signieren, Zahlung im Escrow. Geld fließt erst nach beidseitiger Freigabe." },
  ];
  return (
    <section style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
      <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "88px var(--gutter)" }}>
        <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 56px" }}>
          <div className="fk-eyebrow">So funktioniert&rsquo;s</div>
          <h2 style={{ fontSize: "var(--fs-display-lg)", marginTop: 12, color: "var(--text)" }}>In drei Schritten zum Deal</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }} className="fk-3col">
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "var(--radius-lg)",
                    background: "var(--navy-600)",
                    color: "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "var(--shadow-brand)",
                  }}
                >
                  <Icon name={s.icon} size={24} />
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-subtle)", fontSize: "var(--fs-sm)" }}>0{i + 1}</span>
              </div>
              <h3 style={{ fontSize: "var(--fs-h3)", color: "var(--text)" }}>{s.t}</h3>
              <p style={{ color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Proof */
export function ProofBar() {
  const stats = [
    { value: "12.400+", label: "Verifizierte Profile" },
    { value: "€8,6 Mio", label: "Vermitteltes Volumen" },
    { value: "2.100+", label: "Erfolgreiche Deals" },
    { value: "4,9 / 5", label: "Ø Bewertung" },
  ];
  return (
    <section style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "64px var(--gutter)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }} className="fk-4col">
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "var(--fs-display-lg)", color: "var(--primary)", letterSpacing: "-0.02em" }}>
              {s.value}
            </div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", fontWeight: 600, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Testimonials */
export function Testimonials() {
  const items = [
    {
      name: "Jonas Weber",
      role: "Marketing, NordSport GmbH",
      text: "Wir haben in zwei Wochen drei regionale Creator gefunden, die perfekt zur Marke passen. Die Escrow-Abwicklung nimmt uns jedes Risiko.",
      rating: 5,
    },
    {
      name: "Aylin Demir",
      role: "Fitness-Creatorin, 210K",
      text: "Endlich faire Konditionen und pünktliche Zahlung. Der Vertrag war in 5 Minuten unterschrieben.",
      rating: 5,
    },
    {
      name: "TSV Lindenau",
      role: "Amateurverein",
      text: "Als kleiner Verein hätten wir nie gedacht, einen Trikotsponsor zu finden. Über Flenzko lief es seriös und transparent.",
      rating: 4.5,
    },
  ];
  return (
    <section style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
      <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "88px var(--gutter)" }}>
        <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 48px" }}>
          <div className="fk-eyebrow">Vertrauen, das verbindet</div>
          <h2 style={{ fontSize: "var(--fs-display-lg)", marginTop: 12, color: "var(--text)" }}>Beide Seiten kommen ins Spiel</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }} className="fk-3col">
          {items.map((it, i) => (
            <Card key={i} padding="lg">
              <RatingStars value={it.rating} size={16} />
              <p style={{ fontSize: "var(--fs-base)", lineHeight: 1.6, color: "var(--text)", margin: "14px 0 18px" }}>&bdquo;{it.text}&ldquo;</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={it.name} size="md" verified={i !== 2} />
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--fs-sm)", color: "var(--text)" }}>{it.name}</div>
                  <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{it.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Dual CTA */
function CtaPanel({
  tone,
  eyebrow,
  title,
  points,
  cta,
  ctaVariant,
}: {
  tone: "sponsor" | "creator";
  eyebrow: string;
  title: string;
  points: string[];
  cta: string;
  ctaVariant: "energy" | "primary";
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 280,
        padding: "var(--space-10)",
        borderRadius: "var(--radius-2xl)",
        background: tone === "sponsor" ? "linear-gradient(160deg, var(--navy-600), var(--navy-800))" : "var(--surface)",
        color: tone === "sponsor" ? "#fff" : "var(--text)",
        border: tone === "sponsor" ? "none" : "1px solid var(--border)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "var(--fs-2xs)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: tone === "sponsor" ? "var(--teal-300)" : "var(--accent)",
        }}
      >
        {eyebrow}
      </div>
      <h3 style={{ fontSize: "var(--fs-h2)", margin: "12px 0 20px", color: tone === "sponsor" ? "#fff" : "var(--text)" }}>{title}</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 12 }}>
        {points.map((p, i) => (
          <li
            key={i}
            style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: "var(--fs-base)", color: tone === "sponsor" ? "var(--navy-100)" : "var(--text-muted)" }}
          >
            <Icon name="check" size={20} color={tone === "sponsor" ? "var(--teal-300)" : "var(--accent)"} />
            {p}
          </li>
        ))}
      </ul>
      <Button variant={ctaVariant} size="lg" fullWidth>
        {cta}
      </Button>
    </div>
  );
}

export function DualCTA() {
  return (
    <section style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "88px var(--gutter)" }}>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <CtaPanel
          tone="sponsor"
          eyebrow="Für Sponsoren"
          title="Erreiche die richtige Zielgruppe"
          cta="Talente entdecken"
          ctaVariant="energy"
          points={[
            "Verifizierte Profile mit echten Reichweiten",
            "Filter nach Kategorie, Region & Budget",
            "Verträge & Zahlung sicher in einer Plattform",
          ]}
        />
        <CtaPanel
          tone="creator"
          eyebrow="Für Gesponserte"
          title="Verdiene mit dem, was du liebst"
          cta="Profil kostenlos erstellen"
          ctaVariant="primary"
          points={[
            "Kostenloses Profil mit Mediakit",
            "Faire Konditionen, pünktliche Auszahlung",
            "Bewertungen bauen deinen Ruf auf",
          ]}
        />
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Footer */
export function SiteFooter() {
  const cols = [
    { h: "Produkt", items: ["So funktioniert’s", "Preise", "Für Sponsoren", "Für Creator"] },
    { h: "Unternehmen", items: ["Über uns", "Karriere", "Presse", "Kontakt"] },
    { h: "Rechtliches", items: ["Impressum", "Datenschutz", "AGB", "Escrow & Sicherheit"] },
  ];
  return (
    <footer style={{ background: "var(--navy-900)", color: "var(--navy-100)" }}>
      <div
        style={{
          maxWidth: "var(--container)",
          margin: "0 auto",
          padding: "64px var(--gutter) 40px",
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
          gap: 32,
        }}
        className="fk-foot"
      >
        <div>
          <Logo tone="white" />
          <p style={{ marginTop: 16, fontSize: "var(--fs-sm)", color: "var(--navy-200)", maxWidth: 280, lineHeight: 1.6 }}>
            Der vertrauenswürdige Sponsoring-Marktplatz für den deutschsprachigen Raum.
          </p>
          <div style={{ marginTop: 16 }}>
            <VerifiedBadge type="secure" />
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.h}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--fs-sm)", color: "#fff", marginBottom: 14 }}>{c.h}</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {c.items.map((it) => (
                <li key={it}>
                  <a href="#" style={{ fontSize: "var(--fs-sm)", color: "var(--navy-200)", textDecoration: "none" }}>
                    {it}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div
        style={{
          borderTop: "1px solid var(--navy-700)",
          padding: "20px var(--gutter)",
          maxWidth: "var(--container)",
          margin: "0 auto",
          fontSize: "var(--fs-xs)",
          color: "var(--navy-300)",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span>© 2026 Flenzko GmbH</span>
        <span>Zahlungen abgesichert über Stripe Connect</span>
      </div>
    </footer>
  );
}
