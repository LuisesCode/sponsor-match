"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/Button";

import { startConversation } from "./actions";
import { initialStartConversationFormState } from "./form-state";

/**
 * Kontakt-CTA auf Listing- und Profilseite: startet (oder öffnet) die
 * Konversation mit der Gegenseite und leitet in den Chat weiter.
 */
export function ContactButton({
  counterpartProfileId,
  listingId,
  label = "Kontakt aufnehmen",
}: {
  counterpartProfileId: string;
  listingId?: string;
  label?: string;
}) {
  const [state, formAction, pending] = useActionState(
    startConversation,
    initialStartConversationFormState
  );

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <input type="hidden" name="counterpartProfileId" value={counterpartProfileId} />
      {listingId && <input type="hidden" name="listingId" value={listingId} />}
      <Button type="submit" variant="primary" size="sm" loading={pending}>
        {label}
      </Button>
      {state.status === "error" && (
        <span role="alert" style={{ fontSize: "var(--fs-xs)", color: "var(--danger)" }}>
          {state.message}
        </span>
      )}
    </form>
  );
}
