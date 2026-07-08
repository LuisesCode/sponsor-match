import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/auth/SessionContext";
import { getDb } from "@/db/client";
import { startConversation } from "@/db/repositories/conversations";

/**
 * Kontakt-CTA auf Listing- und Profilseite — startet (oder öffnet) die
 * Konversation mit der Gegenseite und leitet in den Chat weiter.
 * Portiert aus app/(app)/nachrichten/ContactButton.tsx.
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
  const { profile } = useSession();
  const navigate = useNavigate();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleClick = async () => {
    if (!profile) return;
    setPending(true);
    setError(null);
    const db = await getDb();
    const result = startConversation(db, profile, counterpartProfileId, listingId ?? null);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    navigate(`/nachrichten/${result.id}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <Button type="button" variant="primary" size="sm" loading={pending} onClick={() => void handleClick()}>
        {label}
      </Button>
      {error && (
        <span role="alert" style={{ fontSize: "var(--fs-xs)", color: "var(--danger)" }}>
          {error}
        </span>
      )}
    </div>
  );
}
