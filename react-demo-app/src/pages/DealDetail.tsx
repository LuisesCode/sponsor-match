import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { DealForm, type DealFormValues } from "@/components/app/DealForm";
import { DealStatusBadge } from "@/components/app/DealStatusBadge";
import { useSession } from "@/auth/SessionContext";
import { getDb } from "@/db/client";
import {
  acceptContract,
  advanceDealStatus,
  counterDealOffer,
  getCommissionPctForDisplay,
  loadDealDetail,
  type DealDetail as DealDetailData,
} from "@/db/repositories/deals";
import { renderContractSections } from "@/lib/contracts/template";
import { DEAL_HAPPY_PATH, MILESTONE_STATUS_LABELS, isDealNegotiable } from "@/lib/deals/status";
import { centsToEuroInput, formatCents, formatDate } from "@/lib/format";
import { counterDealSchema, sumMilestoneAmounts } from "@/lib/validation/deal";

const HAPPY_STEP_LABELS: Record<string, string> = {
  offered: "Angebot",
  negotiating: "Verhandlung",
  agreed: "Vereinbart",
  funded: "Escrow",
  in_progress: "Umsetzung",
  completed: "Abschluss",
};

const sectionHeading: React.CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-display)",
  fontWeight: 800,
  fontSize: "var(--fs-lg)",
};

/** Deal-Workflow-Ansicht — Struktur 1:1 aus deals/[id]/page.tsx + DealActions.tsx. */
export default function DealDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useSession();
  const [detail, setDetail] = React.useState<DealDetailData | null | undefined>(undefined);
  const [commissionPct, setCommissionPct] = React.useState<number | null>(null);
  const [showCounter, setShowCounter] = React.useState(false);
  const [showCancel, setShowCancel] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!id || !profile) return;
    const db = await getDb();
    setDetail(loadDealDetail(db, id, profile.id));
    setCommissionPct(getCommissionPctForDisplay(db));
  }, [id, profile]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (!profile || detail === undefined) return null;
  if (detail === null || !id) {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-16) 0" }}>
        <h1 style={{ fontSize: "var(--fs-h2)" }}>Deal nicht gefunden</h1>
      </div>
    );
  }

  const { deal, milestones, contract, counterpart } = detail;
  const counterpartName = counterpart?.display_name ?? "Gelöschtes Profil";
  const iAmSponsor = deal.sponsor_profile_id === profile.id;
  const iAmProposer = deal.proposed_by_profile_id === profile.id;
  const negotiable = isDealNegotiable(deal.status);
  const acceptedByMe = Boolean(iAmSponsor ? contract?.sponsor_accepted_at : contract?.sponsee_accepted_at);
  const acceptedByOther = Boolean(iAmSponsor ? contract?.sponsee_accepted_at : contract?.sponsor_accepted_at);
  const canAccept = negotiable && !acceptedByMe;
  const canDecline = negotiable && !iAmProposer;
  const canCounter = negotiable;
  const canCancel = ["draft", "offered", "negotiating", "agreed"].includes(deal.status);

  const payout = deal.amount_total - deal.commission_amount;
  const happyIndex = DEAL_HAPPY_PATH.indexOf(deal.status === "negotiating" ? "negotiating" : (deal.status as (typeof DEAL_HAPPY_PATH)[number]));

  async function runAction(fn: (db: Awaited<ReturnType<typeof getDb>>) => void) {
    setPending(true);
    setError(null);
    try {
      const db = await getDb();
      fn(db);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Die Aktion konnte nicht ausgeführt werden.");
    } finally {
      setPending(false);
    }
  }

  const handleCounterSubmit = (values: DealFormValues) => {
    const parsed = counterDealSchema.safeParse({ dealId: id, ...values });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Bitte prüf deine Angaben.");
      return;
    }
    const d = parsed.data;
    void runAction((db) => {
      counterDealOffer(db, profile, {
        dealId: d.dealId,
        title: d.title,
        description: d.description,
        amountTotal: sumMilestoneAmounts(d.milestones),
        milestones: d.milestones.map((m) => ({ title: m.title, amount: m.amount, due_date: m.dueDate })),
      });
      setShowCounter(false);
    });
  };

  return (
    <div style={{ maxWidth: "var(--container-sm)", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <div>
        <Link to="/deals" style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}>
          ← Alle Deals
        </Link>
      </div>

      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, flex: 1, minWidth: 200, fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--fs-h2)", letterSpacing: "-0.03em" }}>
              {deal.title}
            </h1>
            <DealStatusBadge status={deal.status} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <Avatar name={counterpartName} src={counterpart?.avatar_url ?? undefined} size={36} verified={!!counterpart?.is_verified} />
            <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
              mit{" "}
              {counterpart ? (
                <Link to={`/profil/${counterpart.slug}`} style={{ color: "var(--primary)", fontWeight: 600 }}>
                  {counterpartName}
                </Link>
              ) : (
                counterpartName
              )}{" "}
              ·{" "}
              <Link to={`/nachrichten/${deal.conversation_id}`} style={{ color: "var(--primary)", fontWeight: 600 }}>
                Zum Chat
              </Link>
            </span>
          </div>

          {happyIndex >= 0 && (
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
              {DEAL_HAPPY_PATH.map((step, i) => (
                <Badge key={step} size="sm" tone={i < happyIndex ? "accent" : i === happyIndex ? "solid" : "neutral"}>
                  {i + 1}. {HAPPY_STEP_LABELS[step]}
                </Badge>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--space-4)" }}>
            {[
              ["Gesamtbetrag", formatCents(deal.amount_total)],
              [`Provision (${String(deal.commission_pct).replace(".", ",")} %)`, `− ${formatCents(deal.commission_amount)}`],
              ["Auszahlung an Gesponserte", formatCents(payout)],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                  {label}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "var(--fs-xl)" }}>{value}</div>
              </div>
            ))}
          </div>

          {deal.status === "cancelled" && deal.cancelled_reason && (
            <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>Stornierungsgrund: {deal.cancelled_reason}</p>
          )}
          {deal.status === "agreed" && (
            <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
              Beide Seiten haben dem Vertrag zugestimmt. Als Nächstes zahlt der Sponsor den Gesamtbetrag sicher ins Escrow ein
              (folgt mit den Zahlungen — nicht Teil dieses Rebuilds).
            </p>
          )}
        </div>
      </Card>

      {(canAccept || acceptedByMe || canDecline || canCounter || canCancel) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center" }}>
            {canAccept && (
              <Button
                type="button"
                variant="accent"
                loading={pending}
                onClick={() => void runAction((db) => acceptContract(db, profile, id))}
              >
                Vertrag zustimmen
              </Button>
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
              <Button
                type="button"
                variant="ghost"
                loading={pending}
                onClick={() => void runAction((db) => advanceDealStatus(db, profile, id, "declined"))}
              >
                Angebot ablehnen
              </Button>
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

          {error && (
            <p role="alert" style={{ margin: 0, color: "var(--danger)", fontSize: "var(--fs-sm)" }}>
              {error}
            </p>
          )}

          {showCounter && (
            <div style={{ padding: "var(--space-5)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", background: "var(--surface)" }}>
              <h3 style={{ margin: "0 0 var(--space-4)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--fs-lg)" }}>
                Gegenangebot
              </h3>
              <p style={{ margin: "0 0 var(--space-4)", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
                Passe Konditionen und Meilensteine an — bereits erteilte Vertragszustimmungen werden dadurch zurückgesetzt
                und beide Seiten müssen erneut zustimmen.
              </p>
              <DealForm
                onSubmit={handleCounterSubmit}
                submitLabel="Gegenangebot senden"
                commissionPct={commissionPct}
                pending={pending}
                initialValues={{
                  title: deal.title,
                  description: deal.description,
                  milestones: milestones.map((m) => ({ title: m.title, amount: centsToEuroInput(m.amount), dueDate: m.due_date ?? "" })),
                }}
              />
            </div>
          )}

          {showCancel && (
            <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-end", flexWrap: "wrap" }}>
              <Input
                label="Begründung für die Stornierung"
                required
                minLength={5}
                maxLength={1000}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="z. B. Budget wurde gestrichen"
                wrapStyle={{ flex: "1 1 280px" }}
              />
              <Button
                type="button"
                variant="danger"
                loading={pending}
                onClick={() =>
                  void runAction((db) => {
                    advanceDealStatus(db, profile, id, "cancelled", cancelReason);
                    setShowCancel(false);
                  })
                }
              >
                Stornierung bestätigen
              </Button>
            </div>
          )}
        </div>
      )}

      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <h2 style={sectionHeading}>Gegenleistungen & Details</h2>
          <p style={{ margin: 0, whiteSpace: "pre-line", lineHeight: "var(--lh-relaxed)" }}>{deal.description}</p>
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <h2 style={sectionHeading}>Meilensteine</h2>
          <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
            Auszahlung je Meilenstein nach Freigabe — die Zahlungsabwicklung über das Escrow ist nicht Teil dieses
            Rebuilds.
          </p>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {milestones.map((m, i) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  flexWrap: "wrap",
                  padding: "var(--space-3) 0",
                  borderTop: i === 0 ? "none" : "1px solid var(--border)",
                }}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-muted)" }}>{m.position}.</span>
                <span style={{ flex: 1, minWidth: 160, fontWeight: 600 }}>{m.title}</span>
                {m.due_date && <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>fällig {formatDate(m.due_date)}</span>}
                <Badge size="sm" tone={m.status === "pending" ? "neutral" : m.status === "disputed" ? "danger" : "success"}>
                  {MILESTONE_STATUS_LABELS[m.status]}
                </Badge>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{formatCents(m.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <h2 style={{ ...sectionHeading, flex: 1 }}>Vertrag</h2>
            {contract && (
              <Badge size="sm" tone="neutral">
                Vorlage {contract.template_version}
              </Badge>
            )}
          </div>

          {!contract ? (
            <p style={{ margin: 0, color: "var(--text-muted)" }}>Zu diesem Deal liegt noch kein Vertrag vor.</p>
          ) : (
            <>
              <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
                <Badge size="sm" tone={contract.sponsor_accepted_at ? "success" : "neutral"} dot>
                  Sponsor {contract.sponsor_accepted_at ? `zugestimmt am ${formatDate(contract.sponsor_accepted_at)}` : "— Zustimmung offen"}
                </Badge>
                <Badge size="sm" tone={contract.sponsee_accepted_at ? "success" : "neutral"} dot>
                  Gesponserte:r {contract.sponsee_accepted_at ? `zugestimmt am ${formatDate(contract.sponsee_accepted_at)}` : "— Zustimmung offen"}
                </Badge>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {renderContractSections(contract.content).map((section) => (
                  <div key={section.heading}>
                    <h3 style={{ margin: "0 0 var(--space-2)", fontSize: "var(--fs-base)", fontWeight: 700 }}>{section.heading}</h3>
                    {section.paragraphs.map((paragraph, i) => (
                      <p key={i} style={{ margin: "0 0 var(--space-1)", fontSize: "var(--fs-sm)", lineHeight: "var(--lh-relaxed)", whiteSpace: "pre-line" }}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ))}
              </div>

              <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--text-subtle)" }}>Unverbindliche Muster-Vorlage der Plattform.</p>
              {negotiable && !acceptedByMe && (
                <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
                  {acceptedByOther
                    ? `${counterpartName} hat bereits zugestimmt — mit deiner Zustimmung kommt der Deal zustande.`
                    : "Stimme dem Vertrag oben über „Vertrag zustimmen“ zu, wenn die Konditionen passen."}
                </p>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
