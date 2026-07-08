import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  SiteNav,
  Hero,
  HowItWorks,
  ProofBar,
  Testimonials,
  DualCTA,
  SiteFooter,
} from "./sections";

/**
 * Flenzko — Landingpage.
 * Theme-Umschaltung via data-theme="dark" auf <html> (Design-System-Konvention).
 * Die Initialisierung übernimmt ein Inline-Script im Root-Layout (kein Flash);
 * Logo/Toggle-Icon wechseln rein per CSS — daher hier kein Theme-State nötig.
 */
export function LandingPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Von einer anderen Seite kommend (z.B. /entdecken) wird per navigate-state
  // signalisiert, wohin gescrollt werden soll — HashRouter erlaubt keine
  // normalen URL-Anker fürs Scrollen (siehe SiteNav).
  React.useEffect(() => {
    const scrollTo = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (!scrollTo) return;
    document.getElementById(scrollTo)?.scrollIntoView({ behavior: "smooth" });
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const toggleTheme = () => {
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
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <SiteNav onToggleTheme={toggleTheme} />
      <main style={{ flex: 1 }}>
        <Hero />
        <HowItWorks />
        <ProofBar />
        <Testimonials />
        <DualCTA />
      </main>
      <SiteFooter />
    </div>
  );
}
