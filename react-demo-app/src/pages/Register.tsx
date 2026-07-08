import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/app/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormAlert } from "@/components/ui/FormAlert";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { useSession } from "@/auth/SessionContext";
import { getDb } from "@/db/client";
import { createAccount } from "@/db/repositories/profiles";
import { registerSchema } from "@/lib/validation/auth";

type Role = "sponsor" | "sponsee";
type FieldErrors = Partial<Record<string, string[]>>;

const ROLES: Array<{ value: Role; icon: string; title: string; description: string }> = [
  { value: "sponsor", icon: "briefcase", title: "Sponsor", description: "Ich vertrete eine Marke und suche passende Talente." },
  { value: "sponsee", icon: "trophy", title: "Gesponserter", description: "Ich bin Sportler, Verein oder Creator und suche Sponsoren." },
];

function RoleCards({ value, onChange, error }: { value: Role | null; onChange: (role: Role) => void; error?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text)" }}>
        Ich bin …<span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>
      </span>
      <div role="radiogroup" aria-label="Rolle wählen" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-3)" }}>
        {ROLES.map((role) => {
          const selected = value === role.value;
          return (
            <button
              key={role.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(role.value)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "var(--space-2)",
                textAlign: "left",
                padding: "var(--space-4)",
                background: selected ? "var(--accent-soft)" : "var(--surface)",
                border: `1.5px solid ${selected ? "var(--accent)" : error ? "var(--danger)" : "var(--border-strong)"}`,
                borderRadius: "var(--radius-lg)",
                boxShadow: selected ? "var(--shadow-sm)" : "var(--shadow-xs)",
                cursor: "pointer",
                transition: "border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-md)",
                  background: selected ? "var(--accent)" : "var(--surface-2)",
                  color: selected ? "var(--on-accent)" : "var(--text-muted)",
                  transition: "background var(--dur-fast), color var(--dur-fast)",
                }}
              >
                <Icon name={role.icon} size={20} />
              </span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--fs-base)", color: "var(--text)" }}>{role.title}</span>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{role.description}</span>
            </button>
          );
        })}
      </div>
      {error && <span style={{ fontSize: "var(--fs-xs)", color: "var(--danger)" }}>{error}</span>}
    </div>
  );
}

export default function Register() {
  const { login } = useSession();
  const navigate = useNavigate();
  const [role, setRole] = React.useState<Role | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [message, setMessage] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const parsed = registerSchema.safeParse({
      role: formData.get("role"),
      displayName: formData.get("displayName"),
      email: formData.get("email"),
      password: formData.get("password"),
      acceptTerms: formData.get("acceptTerms") === "on",
    });
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as FieldErrors);
      setPending(false);
      return;
    }

    const db = await getDb();
    try {
      const profile = await createAccount(db, parsed.data);
      // Kein E-Mail-Versand möglich (kein Server) — Konto ist sofort aktiv.
      await login(profile.id);
      navigate("/onboarding");
    } catch (err) {
      if (err instanceof Error && err.message === "EMAIL_TAKEN") {
        setMessage("Mit dieser E-Mail-Adresse existiert bereits ein Konto. Melde dich stattdessen an.");
      } else {
        setMessage("Die Registrierung hat nicht geklappt. Bitte versuch es gleich noch einmal.");
      }
      setPending(false);
    }
  };

  return (
    <AuthLayout>
      <Card padding="lg">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          <div>
            <span className="fk-eyebrow">Kostenlos starten</span>
            <h1 style={{ fontSize: "var(--fs-h2)", marginTop: "var(--space-1)" }}>Konto erstellen</h1>
          </div>

          {message && <FormAlert>{message}</FormAlert>}

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {role && <input type="hidden" name="role" value={role} />}
            <RoleCards value={role} onChange={setRole} error={fieldErrors.role?.[0]} />
            <Input
              label="Anzeigename"
              name="displayName"
              autoComplete="name"
              required
              hint="So erscheinst du auf der Plattform — z.B. dein Name, Verein oder deine Marke."
              error={fieldErrors.displayName?.[0]}
            />
            <Input label="E-Mail-Adresse" name="email" type="email" autoComplete="email" required error={fieldErrors.email?.[0]} />
            <Input
              label="Passwort"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              hint="Mindestens 8 Zeichen."
              error={fieldErrors.password?.[0]}
            />
            <Checkbox
              name="acceptTerms"
              label="Ich stimme den AGB und der Datenschutzerklärung zu."
              error={fieldErrors.acceptTerms?.[0]}
            />
            <Button type="submit" fullWidth size="lg" loading={pending}>
              Konto erstellen
            </Button>
          </form>

          <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", margin: 0 }}>
            Schon dabei?{" "}
            <Link to="/login" style={{ fontWeight: 600 }}>
              Jetzt anmelden
            </Link>
          </p>
        </div>
      </Card>
    </AuthLayout>
  );
}
