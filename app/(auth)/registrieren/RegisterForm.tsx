"use client";

import Link from "next/link";
import * as React from "react";

import { register } from "@/app/(auth)/actions";
import { initialAuthFormState } from "@/app/(auth)/form-state";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";

import { FormAlert } from "../login/LoginForm";

type Role = "sponsor" | "sponsee";

const ROLES: Array<{
  value: Role;
  icon: string;
  title: string;
  description: string;
}> = [
  {
    value: "sponsor",
    icon: "briefcase",
    title: "Sponsor",
    description: "Ich vertrete eine Marke und suche passende Talente.",
  },
  {
    value: "sponsee",
    icon: "trophy",
    title: "Gesponserter",
    description: "Ich bin Sportler, Verein oder Creator und suche Sponsoren.",
  },
];

/** Rollenwahl als Karten-Auswahl (Radio-Semantik, Tastatur-bedienbar). */
function RoleCards({
  value,
  onChange,
  error,
}: {
  value: Role | null;
  onChange: (role: Role) => void;
  error?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--fs-sm)",
          fontWeight: 600,
          color: "var(--text)",
        }}
      >
        Ich bin …<span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>
      </span>
      <div
        role="radiogroup"
        aria-label="Rolle wählen"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "var(--space-3)",
        }}
      >
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
                transition:
                  "border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)",
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
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "var(--fs-base)",
                  color: "var(--text)",
                }}
              >
                {role.title}
              </span>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
                {role.description}
              </span>
            </button>
          );
        })}
      </div>
      {error && (
        <span style={{ fontSize: "var(--fs-xs)", color: "var(--danger)" }}>
          {error}
        </span>
      )}
    </div>
  );
}

export function RegisterForm() {
  const [state, formAction, pending] = React.useActionState(
    register,
    initialAuthFormState
  );
  const [role, setRole] = React.useState<Role | null>(null);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  if (state.status === "success") {
    return (
      <Card padding="lg">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
            alignItems: "flex-start",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: "var(--radius-pill)",
              background: "var(--accent-soft)",
              color: "var(--accent)",
            }}
          >
            <Icon name="mail-check" size={24} />
          </span>
          <h1 style={{ fontSize: "var(--fs-h2)", margin: 0 }}>
            Bestätige deine E-Mail-Adresse
          </h1>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>
            Wir haben dir eine E-Mail an{" "}
            <strong style={{ color: "var(--text)" }}>{state.email}</strong>{" "}
            geschickt. Klick auf den Link darin, um dein Konto zu aktivieren —
            danach geht es direkt mit deinem Profil weiter.
          </p>
          <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
            Keine E-Mail bekommen? Schau auch im Spam-Ordner nach.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <div
        style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}
      >
        <div>
          <span className="sm-eyebrow">Kostenlos starten</span>
          <h1 style={{ fontSize: "var(--fs-h2)", marginTop: "var(--space-1)" }}>
            Konto erstellen
          </h1>
        </div>

        {state.status === "error" && state.message && (
          <FormAlert>{state.message}</FormAlert>
        )}

        <form
          action={formAction}
          noValidate
          style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
        >
          {role && <input type="hidden" name="role" value={role} />}
          <RoleCards
            value={role}
            onChange={setRole}
            error={fieldErrors?.role?.[0]}
          />
          <Input
            label="Anzeigename"
            name="displayName"
            autoComplete="name"
            required
            hint="So erscheinst du auf der Plattform — z.B. dein Name, Verein oder deine Marke."
            error={fieldErrors?.displayName?.[0]}
          />
          <Input
            label="E-Mail-Adresse"
            name="email"
            type="email"
            autoComplete="email"
            required
            error={fieldErrors?.email?.[0]}
          />
          <Input
            label="Passwort"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            hint="Mindestens 8 Zeichen."
            error={fieldErrors?.password?.[0]}
          />
          {/* TODO: rechtlich prüfen (Pflicht-Checkbox, Texte & Einwilligungsnachweis) */}
          <Checkbox
            name="acceptTerms"
            label={
              <>
                Ich stimme den <Link href="/agb">AGB</Link> und der{" "}
                <Link href="/datenschutz">Datenschutzerklärung</Link> zu.
              </>
            }
            error={fieldErrors?.acceptTerms?.[0]}
          />
          <Button type="submit" fullWidth size="lg" loading={pending}>
            Konto erstellen
          </Button>
        </form>

        <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", margin: 0 }}>
          Schon dabei?{" "}
          <Link href="/login" style={{ fontWeight: 600 }}>
            Jetzt anmelden
          </Link>
        </p>
      </div>
    </Card>
  );
}
