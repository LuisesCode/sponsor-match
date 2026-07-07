import type { DealStatus, MilestoneStatus } from "@/lib/supabase/types";

/**
 * SponsorMatch — Deal-Statusmodell (M5, vgl. PLAN.md §3).
 * Spiegelt die Übergänge aus public.advance_deal_status(); maßgeblich ist
 * IMMER die Postgres-Funktion — dieses Modul dient der UI (welche Buttons
 * zeigen wir wem) und den Tests.
 */

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  draft: "Entwurf",
  offered: "Angebot",
  negotiating: "In Verhandlung",
  agreed: "Vereinbart",
  funded: "Im Escrow",
  in_progress: "In Umsetzung",
  completed: "Abgeschlossen",
  declined: "Abgelehnt",
  cancelled: "Storniert",
  disputed: "Streitfall",
};

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  pending: "Offen",
  submitted: "Eingereicht",
  approved: "Freigegeben",
  paid: "Ausgezahlt",
  disputed: "Streitfall",
};

/** Erlaubte Statuswechsel (identisch zur SQL-Statusmaschine). */
export const DEAL_TRANSITIONS: Record<DealStatus, readonly DealStatus[]> = {
  draft: ["offered", "cancelled"],
  offered: ["negotiating", "agreed", "declined", "cancelled"],
  negotiating: ["agreed", "declined", "cancelled"],
  agreed: ["funded", "cancelled"],
  funded: ["in_progress", "disputed"],
  in_progress: ["completed", "disputed"],
  completed: [],
  declined: [],
  cancelled: [],
  disputed: [],
};

export function canTransition(from: DealStatus, to: DealStatus): boolean {
  return DEAL_TRANSITIONS[from].includes(to);
}

/** Der „Happy Path" für die Workflow-Anzeige auf /deals/[id]. */
export const DEAL_HAPPY_PATH: readonly DealStatus[] = [
  "offered",
  "negotiating",
  "agreed",
  "funded",
  "in_progress",
  "completed",
];

/** Endzustände — blockieren keinen neuen Deal in derselben Konversation. */
export const DEAL_CLOSED_STATUSES: readonly DealStatus[] = ["declined", "cancelled", "completed"];

export function isDealOpen(status: DealStatus): boolean {
  return !DEAL_CLOSED_STATUSES.includes(status);
}

/** In diesen Status kann verhandelt (Gegenangebot) und zugestimmt werden. */
export function isDealNegotiable(status: DealStatus): boolean {
  return status === "offered" || status === "negotiating";
}
