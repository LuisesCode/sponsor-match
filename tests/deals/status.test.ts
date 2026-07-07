import { describe, expect, it } from "vitest";

import {
  DEAL_CLOSED_STATUSES,
  DEAL_HAPPY_PATH,
  DEAL_TRANSITIONS,
  canTransition,
  isDealNegotiable,
  isDealOpen,
} from "@/lib/deals/status";
import type { DealStatus } from "@/lib/supabase/types";

describe("Deal-Statusmaschine (Spiegel von advance_deal_status)", () => {
  it("erlaubt den Happy Path draft → … → completed", () => {
    expect(canTransition("draft", "offered")).toBe(true);
    for (let i = 0; i < DEAL_HAPPY_PATH.length - 1; i++) {
      const from = DEAL_HAPPY_PATH[i];
      const to = DEAL_HAPPY_PATH[i + 1];
      // offered → agreed überspringt negotiating — beides erlaubt.
      expect(canTransition(from, to) || canTransition(from, "agreed")).toBe(true);
    }
    expect(canTransition("offered", "agreed")).toBe(true);
  });

  it("erlaubt die Seitenpfade declined/cancelled/disputed nur an den richtigen Stellen", () => {
    expect(canTransition("offered", "declined")).toBe(true);
    expect(canTransition("negotiating", "declined")).toBe(true);
    expect(canTransition("agreed", "declined")).toBe(false);

    expect(canTransition("draft", "cancelled")).toBe(true);
    expect(canTransition("agreed", "cancelled")).toBe(true);
    expect(canTransition("funded", "cancelled")).toBe(false); // ab Escrow nur disputed

    expect(canTransition("funded", "disputed")).toBe(true);
    expect(canTransition("in_progress", "disputed")).toBe(true);
    expect(canTransition("offered", "disputed")).toBe(false);
  });

  it("verbietet Sprünge und Rückwärtsbewegungen", () => {
    expect(canTransition("offered", "funded")).toBe(false);
    expect(canTransition("agreed", "offered")).toBe(false);
    expect(canTransition("draft", "agreed")).toBe(false);
    expect(canTransition("negotiating", "in_progress")).toBe(false);
  });

  it("Endzustände haben keine ausgehenden Übergänge", () => {
    for (const status of ["completed", "declined", "cancelled", "disputed"] as DealStatus[]) {
      expect(DEAL_TRANSITIONS[status]).toHaveLength(0);
    }
  });

  it("isDealOpen/isDealNegotiable passen zu den Endzuständen", () => {
    for (const status of DEAL_CLOSED_STATUSES) {
      expect(isDealOpen(status)).toBe(false);
    }
    expect(isDealOpen("disputed")).toBe(true); // ungelöst → blockiert neue Deals
    expect(isDealNegotiable("offered")).toBe(true);
    expect(isDealNegotiable("negotiating")).toBe(true);
    expect(isDealNegotiable("agreed")).toBe(false);
  });
});
