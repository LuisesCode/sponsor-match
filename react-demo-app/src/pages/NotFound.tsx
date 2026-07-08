import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        minHeight: "60vh",
        textAlign: "center",
        padding: "0 var(--gutter)",
      }}
    >
      <div className="fk-eyebrow">404</div>
      <h1 style={{ fontSize: "var(--fs-h1)" }}>Diese Seite gibt es nicht.</h1>
      <p style={{ color: "var(--text-muted)", maxWidth: 420 }}>
        Der Link ist entweder veraltet oder falsch geschrieben.
      </p>
      <Link to="/">
        <Button variant="primary">Zur Startseite</Button>
      </Link>
    </section>
  );
}
