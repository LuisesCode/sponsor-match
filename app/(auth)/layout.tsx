import Link from "next/link";

/** Zentriertes Layout für Login/Registrierung mit Logo und Rechtslinks. */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-6)",
        padding: "var(--space-10) var(--gutter)",
      }}
    >
      <Link href="/" aria-label="Zur Startseite">
        {/* Logo-Variante wird per CSS-Theme umgeschaltet (kein Hydration-Mismatch) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-wordmark.svg" alt="SponsorMatch" style={{ height: 32 }} className="sm-light-only" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-wordmark-dark.svg" alt="SponsorMatch" style={{ height: 32 }} className="sm-dark-only" />
      </Link>
      <div style={{ width: "100%", maxWidth: 480 }}>{children}</div>
      <p
        style={{
          fontSize: "var(--fs-xs)",
          color: "var(--text-subtle)",
          display: "flex",
          gap: "var(--space-4)",
        }}
      >
        <Link href="/agb" style={{ color: "inherit" }}>
          AGB
        </Link>
        <Link href="/datenschutz" style={{ color: "inherit" }}>
          Datenschutz
        </Link>
        <Link href="/impressum" style={{ color: "inherit" }}>
          Impressum
        </Link>
      </p>
    </main>
  );
}
