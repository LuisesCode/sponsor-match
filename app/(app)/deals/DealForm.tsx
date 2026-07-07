"use client";

import * as React from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { formatCents } from "@/lib/format";
import { DEAL_MILESTONES_MAX } from "@/lib/validation/deal";
import { euroToCents } from "@/lib/validation/onboarding";

import type { DealFormState } from "./form-state";
import { initialDealFormState } from "./form-state";

export type MilestoneRow = { title: string; amount: string; dueDate: string };

const EMPTY_ROW: MilestoneRow = { title: "", amount: "", dueDate: "" };

/**
 * Formular für „Deal vorschlagen" und Gegenangebot: Konditionen +
 * Meilenstein-Editor. Der Gesamtbetrag ergibt sich aus der Summe der
 * Meilensteine; die Provision wird serverseitig eingefroren und berechnet.
 */
export function DealForm({
  action,
  hiddenFields,
  submitLabel,
  commissionPct,
  initialValues,
}: {
  action: (prev: DealFormState, formData: FormData) => Promise<DealFormState>;
  hiddenFields: Record<string, string>;
  submitLabel: string;
  /** Aktueller Provisionssatz (nur Info-Anzeige; verbindlich rechnet die DB). */
  commissionPct: number | null;
  initialValues?: { title: string; description: string; milestones: MilestoneRow[] };
}) {
  const [state, formAction, pending] = React.useActionState(action, initialDealFormState);
  const [milestones, setMilestones] = React.useState<MilestoneRow[]>(
    initialValues?.milestones?.length ? initialValues.milestones : [{ ...EMPTY_ROW }]
  );

  const fieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  function updateRow(index: number, patch: Partial<MilestoneRow>) {
    setMilestones((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  // Live-Summe: nur anzeigen, wenn alle Beträge parsebar sind.
  const cents = milestones.map((m) => euroToCents(m.amount));
  const totalCents = cents.every((c): c is number => typeof c === "number" && c > 0)
    ? cents.reduce((sum, c) => sum + c, 0)
    : null;

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <input type="hidden" name="milestones" value={JSON.stringify(milestones)} />

      <Input
        label="Titel des Deals"
        name="title"
        required
        maxLength={120}
        defaultValue={initialValues?.title}
        placeholder="z. B. Ausrüstungspartnerschaft Saison 2026/27"
        error={fieldErrors.title?.[0]}
      />

      <Textarea
        label="Gegenleistungen & Details"
        name="description"
        required
        rows={5}
        maxLength={5000}
        defaultValue={initialValues?.description}
        placeholder="Was wird gesponsert, welche Gegenleistungen sind vereinbart, welcher Zeitraum?"
        error={fieldErrors.description?.[0]}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <span style={{ fontSize: "var(--fs-sm)", fontWeight: 600 }}>
          Meilensteine
          <span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>
        </span>
        <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
          Die Auszahlung erfolgt später je Meilenstein aus dem Escrow — die Summe der
          Meilensteine ist der Gesamtbetrag des Deals.
        </p>

        {milestones.map((row, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "var(--space-3)",
              alignItems: "flex-start",
              flexWrap: "wrap",
              padding: "var(--space-3)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              background: "var(--surface-2)",
            }}
          >
            <Input
              aria-label={`Meilenstein ${i + 1}: Titel`}
              placeholder={`Meilenstein ${i + 1} — z. B. Kickoff & Ankündigung`}
              value={row.title}
              maxLength={120}
              onChange={(e) => updateRow(i, { title: e.target.value })}
              wrapStyle={{ flex: "2 1 220px" }}
            />
            <Input
              aria-label={`Meilenstein ${i + 1}: Betrag in Euro`}
              placeholder="Betrag in €"
              inputMode="decimal"
              value={row.amount}
              onChange={(e) => updateRow(i, { amount: e.target.value })}
              wrapStyle={{ flex: "1 1 120px" }}
            />
            <Input
              aria-label={`Meilenstein ${i + 1}: fällig am`}
              type="date"
              value={row.dueDate}
              onChange={(e) => updateRow(i, { dueDate: e.target.value })}
              wrapStyle={{ flex: "1 1 150px" }}
            />
            {milestones.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMilestones((rows) => rows.filter((_, idx) => idx !== i))}
                aria-label={`Meilenstein ${i + 1} entfernen`}
              >
                Entfernen
              </Button>
            )}
          </div>
        ))}

        {fieldErrors.milestones?.[0] && (
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--danger)" }}>
            {fieldErrors.milestones[0]}
          </span>
        )}

        {milestones.length < DEAL_MILESTONES_MAX && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMilestones((rows) => [...rows, { ...EMPTY_ROW }])}
            style={{ alignSelf: "flex-start" }}
          >
            Meilenstein hinzufügen
          </Button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-1)",
          padding: "var(--space-4)",
          borderRadius: "var(--radius-md)",
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-sm)" }}>
          <span>Gesamtbetrag</span>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
            {totalCents != null ? formatCents(totalCents) : "—"}
          </span>
        </div>
        {commissionPct != null && (
          <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
            Plattformprovision aktuell {String(commissionPct).replace(".", ",")} % — wird beim
            Vorschlag für diesen Deal eingefroren und von der Auszahlung an die gesponserte
            Seite abgezogen.
          </p>
        )}
      </div>

      {state.status === "error" && state.message && (
        <p role="alert" style={{ margin: 0, color: "var(--danger)", fontSize: "var(--fs-sm)" }}>
          {state.message}
        </p>
      )}

      <Button type="submit" variant="primary" loading={pending} style={{ alignSelf: "flex-start" }}>
        {submitLabel}
      </Button>
    </form>
  );
}
