import * as React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "@/components/app/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormAlert } from "@/components/ui/FormAlert";
import { Input } from "@/components/ui/Input";
import { useSession } from "@/auth/SessionContext";
import { getDb } from "@/db/client";
import { verifyLogin } from "@/db/repositories/profiles";
import { loginSchema, sanitizeNextPath } from "@/lib/validation/auth";

type FieldErrors = Partial<Record<string, string[]>>;

export default function Login() {
  const { login } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = sanitizeNextPath(params.get("next"), "/dashboard");

  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [message, setMessage] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as FieldErrors);
      setPending(false);
      return;
    }

    const db = await getDb();
    const profile = await verifyLogin(db, parsed.data.email, parsed.data.password);
    if (!profile) {
      setMessage("E-Mail-Adresse oder Passwort ist nicht korrekt.");
      setPending(false);
      return;
    }

    await login(profile.id);
    navigate(profile.onboarding_completed ? next : "/onboarding");
  };

  return (
    <AuthLayout>
      <Card padding="lg">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          <div>
            <span className="fk-eyebrow">Willkommen zurück</span>
            <h1 style={{ fontSize: "var(--fs-h2)", marginTop: "var(--space-1)" }}>Anmelden</h1>
          </div>

          {message && <FormAlert>{message}</FormAlert>}

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <Input
              label="E-Mail-Adresse"
              name="email"
              type="email"
              autoComplete="email"
              required
              error={fieldErrors.email?.[0]}
            />
            <Input
              label="Passwort"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              error={fieldErrors.password?.[0]}
            />
            <Button type="submit" fullWidth size="lg" loading={pending}>
              Anmelden
            </Button>
          </form>

          <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", margin: 0 }}>
            Noch kein Konto?{" "}
            <Link to="/registrieren" style={{ fontWeight: 600 }}>
              Jetzt registrieren
            </Link>
          </p>
        </div>
      </Card>
    </AuthLayout>
  );
}
