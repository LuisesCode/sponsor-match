import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { renderContractSections } from "@/lib/contracts/template";
import {
  DEAL_HAPPY_PATH,
  MILESTONE_STATUS_LABELS,
  isDealNegotiable,
} from "@/lib/deals/status";
import { centsToEuroInput, formatCents, formatDate } from "@/lib/format";
import { getCurrentProfile } from "@/lib/supabase/profile";

import { getCommissionPct, loadDealCounterpart, loadDealDetail } from "../data";
import { DealStatusBadge } from "../DealStatusBadge";
import { DealActions } from "./DealActions";

type Params = { id: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const detail = UUID_RE.test(id) ? await loadDealDetail(id) : null;
  return {
    title: detail ? `${detail.deal.title} — SponsorMatch` : "Deal — SponsorMatch",
  };
}

const sectionHeading: React.CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-display)",
  fontWeight: 800,
  fontSize: "var(--fs-lg)",
};

/** Deal-Workflow-Ansicht: Status, Konditionen, Meilensteine, Vertrag (M5). */
export default async function DealPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const detail = await loadDealDetail(id);
  if (!detail) notFound();
  const { deal, milestones, contract } = detail;

  const [counterpart, commissionPct] = await Promise.all([
    loadDealCounterpart(deal, profile.id),
    getCommissionPct(),
  ]);
  const counterpartName = counterpart?.display_name ?? "Gelöschtes Profil";

  const iAmSponsor = deal.sponsor_profile_id === profile.id;
  const iAmProposer = deal.proposed_by_profile_id === profile.id;
  const negotiable = isDealNegotiable(deal.status);
  const acceptedByMe = Boolean(
    iAmSponsor ? contract?.sponsor_accepted_at : contract?.sponsee_accepted_at
  );
  const acceptedByOther = Boolean(
    iAmSponsor ? contract?.sponsee_accepted_at : contract?.sponsor_accepted_at
  );

  const payout = deal.amount_total - deal.commission_amount;
  const happyIndex = DEAL_HAPPY_PATH.indexOf(
    deal.status === "negotiating" ? "negotiating" : deal.status
  );

  return (
    <div style={{ maxWidth: "var(--container-sm)", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <div>
        <Link href="/deals" style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}>
          ← Alle Deals
        </Link>
      </div>

      {/* Kopf: Titel, Status, Beteiligte, Beträge */}
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, flex: 1, minWidth: 200, fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--fs-2xl)", letterSpacing: "-0.03em" }}>
              {deal.title}
            </h1>
            <DealStatusBadge status={deal.status} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <Avatar
              name={counterpartName}
              src={counterpart?.avatar_url ?? undefined}
              size={36}
              verified={counterpart?.is_verified}
            />
            <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
              mit{" "}
              {counterpart ? (
                <Link href={`/profil/${counterpart.slug}`} style={{ color: "var(--primary)", fontWeight: 600 }}>
                  {counterpartName}
                </Link>
              ) : (
                counterpartName
              )}{" "}
              ·{" "}
              <Link href={`/nachrichten/${deal.conversation_id}`} style={{ color: "var(--primary)", fontWeight: 600 }}>
                Zum Chat
              </Link>
            </span>
          </div>

          {/* Fortschritt auf dem Happy Path */}
          {happyIndex >= 0 && (
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
              {DEAL_HAPPY_PATH.map((step, i) => (
                <Badge
                  key={step}
                  size="sm"
                  tone={i < happyIndex ? "accent" : i === happyIndex ? "solid" : "neutral"}
                >
                  {i + 1}. {step === "offered" ? "Angebot" : step === "negotiating" ? "Verhandlung" : step === "agreed" ? "Vereinbart" : step === "funded" ? "Escrow" : step === "in_progress" ? "Umsetzung" : "Abschluss"}
                </Badge>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--space-4)" }}>
            {[
              ["Gesamtbetrag", formatCents(deal.amount_total)],
              [
                `Provision (${String(deal.commission_pct).replace(".", ",")} %)`,
                `− ${formatCents(deal.commission_amount)}`,
              ],
              ["Auszahlung an Gesponserte", formatCents(payout)],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                  {label}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "var(--fs-xl)" }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {deal.status === "cancelled" && deal.cancelled_reason && (
            <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
              Stornierungsgrund: {deal.cancelled_reason}
            </p>
          )}
          {deal.status === "agreed" && (
            <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
              Beide Seiten haben dem Vertrag zugestimmt. Als Nächstes zahlt der Sponsor den
              Gesamtbetrag sicher ins Escrow ein (folgt mit den Zahlungen in M6).
            </p>
          )}
        </div>
      </Card>

      {/* Aktionen */}
      <DealActions
        dealId={deal.id}
        counterpartName={counterpartName}
        canAccept={negotiable && !acceptedByMe}
        acceptedByMe={negotiable && acceptedByMe}
        canDecline={negotiable && !iAmProposer}
        canCounter={negotiable}
        canCancel={["draft", "offered", "negotiating", "agreed"].includes(deal.status)}
        commissionPct={commissionPct ?? deal.commission_pct}
        counterInitialValues={{
          title: deal.title,
          description: deal.description,
          milestones: milestones.map((m) => ({
            title: m.title,
            amount: centsToEuroInput(m.amount),
            dueDate: m.due_date ?? "",
          })),
        }}
      />

      {/* Beschreibung */}
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <h2 style={sectionHeading}>Gegenleistungen & Details</h2>
          <p style={{ margin: 0, whiteSpace: "pre-line", lineHeight: "var(--lh-relaxed)" }}>
            {deal.description}
          </p>
        </div>
      </Card>

      {/* Meilensteine */}
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <h2 style={sectionHeading}>Meilensteine</h2>
          <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
            Auszahlung je Meilenstein nach Freigabe — die Zahlungsabwicklung über das
            Escrow folgt mit M6.
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
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-muted)" }}>
                  {m.position}.
                </span>
                <span style={{ flex: 1, minWidth: 160, fontWeight: 600 }}>{m.title}</span>
                {m.due_date && (
                  <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
                    fällig {formatDate(m.due_date)}
                  </span>
                )}
                <Badge size="sm" tone={m.status === "pending" ? "neutral" : m.status === "disputed" ? "danger" : "success"}>
                  {MILESTONE_STATUS_LABELS[m.status]}
                </Badge>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                  {formatCents(m.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Vertrag */}
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
            <p style={{ margin: 0, color: "var(--text-muted)" }}>
              Zu diesem Deal liegt noch kein Vertrag vor.
            </p>
          ) : (
            <>
              <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
                <Badge size="sm" tone={contract.sponsor_accepted_at ? "success" : "neutral"} dot>
                  Sponsor{" "}
                  {contract.sponsor_accepted_at
                    ? `zugestimmt am ${formatDate(contract.sponsor_accepted_at)}`
                    : "— Zustimmung offen"}
                </Badge>
                <Badge size="sm" tone={contract.sponsee_accepted_at ? "success" : "neutral"} dot>
                  Gesponserte:r{" "}
                  {contract.sponsee_accepted_at
                    ? `zugestimmt am ${formatDate(contract.sponsee_accepted_at)}`
                    : "— Zustimmung offen"}
                </Badge>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {renderContractSections(contract.content).map((section) => (
                  <div key={section.heading}>
                    <h3 style={{ margin: "0 0 var(--space-2)", fontSize: "var(--fs-base)", fontWeight: 700 }}>
                      {section.heading}
                    </h3>
                    {section.paragraphs.map((paragraph, i) => (
                      <p key={i} style={{ margin: "0 0 var(--space-1)", fontSize: "var(--fs-sm)", lineHeight: "var(--lh-relaxed)", whiteSpace: "pre-line" }}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ))}
              </div>

              <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--text-subtle)" }}>
                Unverbindliche Muster-Vorlage der Plattform.
                {/* TODO: rechtlich prüfen — Vorlage & Wirksamkeit der digitalen Zustimmung */}
              </p>
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
