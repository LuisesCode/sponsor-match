"use client";

import * as React from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import { acceptContract, cancelDeal, counterDeal, declineDeal } from "../actions";
import { DealForm, type MilestoneRow } from "../DealForm";
import { initialDealActionState } from "../form-state";

/**
 * Aktionsleiste auf /deals/[id]: Vertrag zustimmen, Angebot ablehnen,
 * Gegenangebot machen, Deal stornieren. Welche Buttons sichtbar sind,
 * entscheidet die Seite (Server) — verbindlich prüft die DB-Statusmaschine.
 */
export function DealActions({
  dealId,
  counterpartName,
  canAccept,
  acceptedByMe,
  canDecline,
  canCounter,
  canCancel,
  commissionPct,
  counterInitialValues,
}: {
  dealId: string;
  counterpartName: string;
  canAccept: boolean;
  acceptedByMe: boolean;
  canDecline: boolean;
  canCounter: boolean;
  canCancel: boolean;
  commissionPct: number | null;
  counterInitialValues: { title: string; description: string; milestones: MilestoneRow[] };
}) {
  const [acceptState, acceptAction, acceptPending] = React.useActionState(
    acceptContract,
    initialDealActionState
  );
  const [declineState, declineAction, declinePending] = React.useActionState(
    declineDeal,
    initialDealActionState
  );
  const [cancelState, cancelAction, cancelPending] = React.useActionState(
    cancelDeal,
    initialDealActionState
  );
  const [showCounter, setShowCounter] = React.useState(false);
  const [showCancel, setShowCancel] = React.useState(false);

  const errors = [acceptState, declineState, cancelState]
    .filter((s) => s.status === "error")
    .map((s) => (s.status === "error" ? s.message : ""));

  if (!canAccept && !acceptedByMe && !canDecline && !canCounter && !canCancel) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center" }}>
        {canAccept && (
          <form action={acceptAction}>
            <input type="hidden" name="dealId" value={dealId} />
            <Button type="submit" variant="accent" loading={acceptPending}>
              Vertrag zustimmen
            </Button>
          </form>
        )}
        {acceptedByMe && (
          <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
            Du hast zugestimmt — jetzt ist {counterpartName} dran.
          </span>
        )}
        {canCounter && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowCounter((v) => !v);
              setShowCancel(false);
            }}
          >
            {showCounter ? "Gegenangebot verwerfen" : "Gegenangebot machen"}
          </Button>
        )}
        {canDecline && (
          <form action={declineAction}>
            <input type="hidden" name="dealId" value={dealId} />
            <Button type="submit" variant="ghost" loading={declinePending}>
              Angebot ablehnen
            </Button>
          </form>
        )}
        {canCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setShowCancel((v) => !v);
              setShowCounter(false);
            }}
          >
            {showCancel ? "Doch nicht stornieren" : "Deal stornieren"}
          </Button>
        )}
      </div>

      {errors.map((message, i) => (
        <p key={i} role="alert" style={{ margin: 0, color: "var(--danger)", fontSize: "var(--fs-sm)" }}>
          {message}
        </p>
      ))}

      {showCounter && (
        <div
          style={{
            padding: "var(--space-5)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            background: "var(--surface)",
          }}
        >
          <h3 style={{ margin: "0 0 var(--space-4)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--fs-lg)" }}>
            Gegenangebot
          </h3>
          <p style={{ margin: "0 0 var(--space-4)", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
            Passe Konditionen und Meilensteine an — bereits erteilte Vertragszustimmungen
            werden dadurch zurückgesetzt und beide Seiten müssen erneut zustimmen.
          </p>
          <DealForm
            action={counterDeal}
            hiddenFields={{ dealId }}
            submitLabel="Gegenangebot senden"
            commissionPct={commissionPct}
            initialValues={counterInitialValues}
          />
        </div>
      )}

      {showCancel && (
        <form
          action={cancelAction}
          style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-end", flexWrap: "wrap" }}
        >
          <input type="hidden" name="dealId" value={dealId} />
          <Input
            label="Begründung für die Stornierung"
            name="reason"
            required
            minLength={5}
            maxLength={1000}
            placeholder="z. B. Budget wurde gestrichen"
            wrapStyle={{ flex: "1 1 280px" }}
          />
          <Button type="submit" variant="danger" loading={cancelPending}>
            Stornierung bestätigen
          </Button>
        </form>
      )}
    </div>
  );
}
