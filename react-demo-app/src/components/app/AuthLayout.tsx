import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/marketing/Logo";

/** Zentriertes Layout für Login/Registrierung mit Logo. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-6)",
        minHeight: "100vh",
        padding: "var(--space-10) var(--gutter)",
      }}
    >
      <Link to="/" aria-label="Zur Startseite">
        <Logo tone="navy" className="fk-light-only" />
        <Logo tone="white" className="fk-dark-only" />
      </Link>
      <div style={{ width: "100%", maxWidth: 480 }}>{children}</div>
    </main>
  );
}
