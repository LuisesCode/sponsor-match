import type { SqlDatabase } from "../client";
import { selectOne } from "../query";
import type { Deal } from "@/lib/types";
import { DEAL_CLOSED_STATUSES } from "@/lib/deals/status";

/**
 * Offener Deal einer Konversation (für den Chat-CTA); null, wenn keiner läuft.
 * Weitere Deal-Funktionen (anlegen, Statuswechsel, Vertrag) folgen in Phase 5.
 */
export function getOpenDealForConversation(db: SqlDatabase, conversationId: string): Deal | null {
  const placeholders = DEAL_CLOSED_STATUSES.map(() => "?").join(",");
  return selectOne<Deal>(
    db,
    `select * from deals where conversation_id = ? and status not in (${placeholders}) limit 1`,
    [conversationId, ...DEAL_CLOSED_STATUSES]
  );
}
