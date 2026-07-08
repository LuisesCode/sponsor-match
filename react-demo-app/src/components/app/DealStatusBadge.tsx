import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { DEAL_STATUS_LABELS } from "@/lib/deals/status";
import type { DealStatus } from "@/lib/types";

const STATUS_TONES: Record<DealStatus, BadgeTone> = {
  draft: "neutral",
  offered: "info",
  negotiating: "warning",
  agreed: "success",
  funded: "primary",
  in_progress: "info",
  completed: "success",
  declined: "danger",
  cancelled: "neutral",
  disputed: "danger",
};

/** Status-Pille eines Deals (deutsche Labels, Farbton je Zustand). */
export function DealStatusBadge({ status, size = "md" }: { status: DealStatus; size?: "sm" | "md" }) {
  return (
    <Badge tone={STATUS_TONES[status]} size={size} dot>
      {DEAL_STATUS_LABELS[status]}
    </Badge>
  );
}
