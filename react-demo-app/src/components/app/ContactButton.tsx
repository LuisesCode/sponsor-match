import { Button } from "@/components/ui/Button";

/**
 * Kontakt-CTA — Platzhalter, bis Phase 4 (Nachrichten) die echte
 * Konversationsanlage baut. Analog zum Original (M3-Platzhalter, in M4
 * durch echten Chat ersetzt).
 */
export function ContactButton({
  counterpartProfileId: _counterpartProfileId,
  listingId: _listingId,
  label = "Nachricht senden",
}: {
  counterpartProfileId: string;
  listingId?: string;
  label?: string;
}) {
  return (
    <Button variant="primary" size="sm" disabled title="Nachrichten sind bald verfügbar.">
      {label}
    </Button>
  );
}
