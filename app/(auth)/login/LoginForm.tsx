"use client";

import Link from "next/link";
import * as React from "react";

import { login } from "@/app/(auth)/actions";
import { initialAuthFormState } from "@/app/(auth)/form-state";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

/** Fehlerbanner im Stil des Design Systems (danger-soft Fläche). */
export function FormAlert({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      style={{
        background: "var(--danger-soft)",
        color: "var(--text)",
        border: "1px solid color-mix(in srgb, var(--danger) 35%, transparent)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-3) var(--space-4)",
        fontSize: "var(--fs-sm)",
      }}
    >
      {children}
    </div>
  );
}

export function LoginForm({
  next,
  verifyError,
}: {
  next: string;
  verifyError: boolean;
}) {
  const [state, formAction, pending] = React.useActionState(
    login,
    initialAuthFormState
  );
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <Card padding="lg">
      <div
        style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}
      >
        <div>
          <span className="sm-eyebrow">Willkommen zurück</span>
          <h1 style={{ fontSize: "var(--fs-h2)", marginTop: "var(--space-1)" }}>
            Anmelden
          </h1>
        </div>

        {verifyError && (
          <FormAlert>
            Der Bestätigungslink ist ungültig oder abgelaufen. Bitte melde dich
            an, um einen neuen Link zu erhalten, oder registriere dich erneut.
          </FormAlert>
        )}
        {state.status === "error" && state.message && (
          <FormAlert>{state.message}</FormAlert>
        )}

        <form
          action={formAction}
          noValidate
          style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
        >
          <input type="hidden" name="next" value={next} />
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
            autoComplete="current-password"
            required
            error={fieldErrors?.password?.[0]}
          />
          <Button type="submit" fullWidth size="lg" loading={pending}>
            Anmelden
          </Button>
        </form>

        <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", margin: 0 }}>
          Noch kein Konto?{" "}
          <Link href="/registrieren" style={{ fontWeight: 600 }}>
            Jetzt registrieren
          </Link>
        </p>
      </div>
    </Card>
  );
}
