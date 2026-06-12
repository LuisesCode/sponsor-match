"use client";

import * as React from "react";
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
 * SponsorMatch — Landingpage.
 * Theme-Umschaltung via data-theme="dark" auf <html> (Design-System-Konvention).
 * Die Initialisierung übernimmt ein Inline-Script im Root-Layout (kein Flash);
 * Logo/Toggle-Icon wechseln rein per CSS — daher hier kein Theme-State nötig.
 */
export function LandingPage() {
  const toggleTheme = () => {
    const isDark = document.documentElement.dataset.theme === "dark";
    if (isDark) {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = "dark";
    }
    try {
      window.localStorage.setItem("sm-theme", isDark ? "light" : "dark");
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
