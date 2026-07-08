import * as React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { DealForm, type DealFormValues } from "@/components/app/DealForm";
import { useSession } from "@/auth/SessionContext";
import { getDb } from "@/db/client";
import { getConversationById } from "@/db/repositories/conversations";
import { getProfileById } from "@/db/repositories/profiles";
import { createDeal, getCommissionPctForDisplay, getOpenDealForConversation } from "@/db/repositories/deals";
import { proposeDealSchema, sumMilestoneAmounts } from "@/lib/validation/deal";

/** "Deal vorschlagen" aus einer Konversation heraus — 1:1 aus deals/neu/page.tsx. */
export default function DealNew() {
  const [params] = useSearchParams();
  const conversationId = params.get("conversation");
  const { profile } = useSession();
  const navigate = useNavigate();
  const [counterpartName, setCounterpartName] = React.useState<string>("die Gegenseite");
  const [commissionPct, setCommissionPct] = React.useState<number | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    if (!conversationId || !profile) return;
    void (async () => {
      const db = await getDb();
      const conversation = getConversationById(db, conversationId);
      if (!conversation) {
        setNotFound(true);
        return;
      }
      const openDeal = getOpenDealForConversation(db, conversationId);
      if (openDeal) {
        navigate(`/deals/${openDeal.id}`, { replace: true });
        return;
      }
      const counterpartId =
        conversation.sponsor_profile_id === profile.id ? conversation.sponsee_profile_id : conversation.sponsor_profile_id;
      const counterpart = getProfileById(db, counterpartId);
      if (counterpart) setCounterpartName(counterpart.display_name);
      setCommissionPct(getCommissionPctForDisplay(db));
    })();
  }, [conversationId, profile, navigate]);

  if (!conversationId || notFound) {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-16) 0" }}>
        <h1 style={{ fontSize: "var(--fs-h2)" }}>Konversation nicht gefunden</h1>
      </div>
    );
  }
  if (!profile) return null;

  const handleSubmit = (values: DealFormValues) => {
    setPending(true);
    setMessage(null);
    const parsed = proposeDealSchema.safeParse({ conversationId, ...values });
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "Bitte prüf deine Angaben.");
      setPending(false);
      return;
    }
    const d = parsed.data;
    getDb()
      .then((db) => {
        const dealId = createDeal(db, profile, {
          conversationId: d.conversationId,
          title: d.title,
          description: d.description,
          amountTotal: sumMilestoneAmounts(d.milestones),
          milestones: d.milestones.map((m) => ({ title: m.title, amount: m.amount, due_date: m.dueDate })),
        });
        navigate(`/deals/${dealId}`);
      })
      .catch((err: unknown) => {
        setMessage(err instanceof Error ? err.message : "Die Aktion konnte nicht ausgeführt werden.");
        setPending(false);
      });
  };

  return (
    <div style={{ maxWidth: "var(--container-sm)", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <div>
        <Link to={`/nachrichten/${conversationId}`} style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}>
          ← Zurück zum Chat
        </Link>
        <h1 style={{ margin: "var(--space-3) 0 0", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--fs-h1)", letterSpacing: "-0.03em" }}>
          Deal vorschlagen
        </h1>
        <p style={{ margin: "var(--space-2) 0 0", color: "var(--text-muted)" }}>
          Dein Angebot an {counterpartName} — nach dem Absenden kann die Gegenseite annehmen, ablehnen oder ein
          Gegenangebot machen. Der Vertrag wird automatisch aus deinen Konditionen befüllt.
        </p>
      </div>

      <Card>
        <DealForm onSubmit={handleSubmit} submitLabel="Deal vorschlagen" commissionPct={commissionPct} message={message} pending={pending} />
      </Card>
    </div>
  );
}
