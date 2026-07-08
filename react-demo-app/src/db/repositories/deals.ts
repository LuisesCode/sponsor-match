import type { SqlDatabase } from "../client";
import { select, selectOne, exec, newId, nowIso } from "../query";
import type {
  Conversation,
  Contract,
  ContractContent,
  Deal,
  DealMilestone,
  DealMilestoneInput,
  DealStatus,
  Profile,
} from "@/lib/types";
import { DEAL_CLOSED_STATUSES, DEAL_TRANSITIONS } from "@/lib/deals/status";
import { calcCommissionAmount } from "@/lib/deals/commission";

/**
 * Spiegelt die Postgres-Funktionen der M5-Migration (create_deal,
 * counter_deal_offer, advance_deal_status, accept_contract) 1:1 als
 * TypeScript-Statusmaschine — hier gibt es keine SECURITY-DEFINER-Funktionen,
 * also übernimmt dieses Modul deren Prüfungen vor jedem Schreibzugriff.
 * Notifications werden bewusst nicht erzeugt (kein Notification-Center in
 * diesem Rebuild, siehe Plan).
 */

class DealError extends Error {}

function getCommissionPct(db: SqlDatabase): number {
  const row = selectOne<{ value: string }>(db, "select value from platform_settings where key = 'commission_pct'");
  if (!row) throw new DealError("Provisionssatz ist nicht konfiguriert.");
  return JSON.parse(row.value) as number;
}

export function getCommissionPctForDisplay(db: SqlDatabase): number | null {
  try {
    return getCommissionPct(db);
  } catch {
    return null;
  }
}

function validateMilestones(milestones: DealMilestoneInput[], amountTotal: number): void {
  if (!Array.isArray(milestones) || milestones.length < 1 || milestones.length > 20) {
    throw new DealError("Ein Deal braucht 1 bis 20 Meilensteine.");
  }
  let sum = 0;
  for (const m of milestones) {
    const title = m.title.trim();
    if (title.length < 3 || title.length > 120) {
      throw new DealError("Meilenstein-Titel müssen 3 bis 120 Zeichen haben.");
    }
    if (!Number.isInteger(m.amount) || m.amount <= 0) {
      throw new DealError("Meilenstein-Beträge müssen über 0 liegen.");
    }
    sum += m.amount;
  }
  if (sum !== amountTotal) {
    throw new DealError(`Die Summe der Meilensteine (${sum}) muss dem Gesamtbetrag (${amountTotal}) entsprechen.`);
  }
}

function buildContractContent(db: SqlDatabase, dealId: string): ContractContent {
  const deal = selectOne<Deal>(db, "select * from deals where id = ?", [dealId])!;
  const sponsor = selectOne<Profile>(db, "select * from profiles where id = ?", [deal.sponsor_profile_id])!;
  const sponsee = selectOne<Profile>(db, "select * from profiles where id = ?", [deal.sponsee_profile_id])!;
  const sponsorProfile = selectOne<{ company_name: string }>(
    db,
    "select company_name from sponsor_profiles where profile_id = ?",
    [deal.sponsor_profile_id]
  );
  const milestones = select<DealMilestone>(db, "select * from deal_milestones where deal_id = ? order by position", [
    dealId,
  ]);

  return {
    template_version: "v1",
    created_at: nowIso(),
    deal: {
      id: deal.id,
      title: deal.title,
      description: deal.description,
      amount_total: deal.amount_total,
      currency: deal.currency,
      commission_pct: deal.commission_pct,
      commission_amount: deal.commission_amount,
      payout_amount: deal.amount_total - deal.commission_amount,
      listing_id: deal.listing_id,
    },
    sponsor: {
      profile_id: sponsor.id,
      display_name: sponsor.display_name,
      company_name: sponsorProfile?.company_name ?? null,
    },
    sponsee: { profile_id: sponsee.id, display_name: sponsee.display_name },
    milestones: milestones.map((m) => ({
      position: m.position,
      title: m.title,
      amount: m.amount,
      due_date: m.due_date,
    })),
  };
}

function insertMilestones(db: SqlDatabase, dealId: string, milestones: DealMilestoneInput[]): void {
  milestones.forEach((m, i) => {
    exec(
      db,
      "insert into deal_milestones (id, deal_id, position, title, due_date, amount, status, proof_url) values (?, ?, ?, ?, ?, ?, 'pending', null)",
      [newId(), dealId, i + 1, m.title.trim(), m.due_date ?? null, m.amount]
    );
  });
}

/** "Deal vorschlagen" aus dem Chat — 1:1 aus create_deal(). */
export function createDeal(
  db: SqlDatabase,
  viewer: Profile,
  input: { conversationId: string; title: string; description: string; amountTotal: number; milestones: DealMilestoneInput[] }
): string {
  const conversation = selectOne<Conversation>(db, "select * from conversations where id = ?", [input.conversationId]);
  if (!conversation || (viewer.id !== conversation.sponsor_profile_id && viewer.id !== conversation.sponsee_profile_id)) {
    throw new DealError("Konversation nicht gefunden oder kein Zugriff.");
  }

  const openPlaceholders = DEAL_CLOSED_STATUSES.map(() => "?").join(",");
  const existingOpen = selectOne(
    db,
    `select id from deals where conversation_id = ? and status not in (${openPlaceholders})`,
    [input.conversationId, ...DEAL_CLOSED_STATUSES]
  );
  if (existingOpen) throw new DealError("Für diese Konversation läuft bereits ein Deal.");

  const pct = getCommissionPct(db);
  validateMilestones(input.milestones, input.amountTotal);

  const dealId = newId();
  const now = nowIso();
  exec(
    db,
    `insert into deals
      (id, conversation_id, listing_id, sponsor_profile_id, sponsee_profile_id, proposed_by_profile_id,
       title, description, amount_total, currency, commission_pct, commission_amount, status,
       cancelled_reason, created_at, updated_at)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, 'eur', ?, ?, 'offered', null, ?, ?)`,
    [
      dealId,
      conversation.id,
      conversation.listing_id,
      conversation.sponsor_profile_id,
      conversation.sponsee_profile_id,
      viewer.id,
      input.title.trim(),
      input.description.trim(),
      input.amountTotal,
      pct,
      calcCommissionAmount(input.amountTotal, pct),
      now,
      now,
    ]
  );
  insertMilestones(db, dealId, input.milestones);
  exec(db, "insert into contracts (id, deal_id, template_version, content, sponsor_accepted_at, sponsee_accepted_at) values (?, ?, 'v1', ?, null, null)", [
    newId(),
    dealId,
    JSON.stringify(buildContractContent(db, dealId)),
  ]);

  return dealId;
}

/** Gegenangebot — 1:1 aus counter_deal_offer(). */
export function counterDealOffer(
  db: SqlDatabase,
  viewer: Profile,
  input: { dealId: string; title: string; description: string; amountTotal: number; milestones: DealMilestoneInput[] }
): void {
  const deal = selectOne<Deal>(db, "select * from deals where id = ?", [input.dealId]);
  if (!deal || (viewer.id !== deal.sponsor_profile_id && viewer.id !== deal.sponsee_profile_id)) {
    throw new DealError("Deal nicht gefunden oder kein Zugriff.");
  }
  if (!["draft", "offered", "negotiating"].includes(deal.status)) {
    throw new DealError(`In Status ${deal.status} sind keine Änderungen am Angebot mehr möglich.`);
  }

  validateMilestones(input.milestones, input.amountTotal);
  const now = nowIso();
  exec(
    db,
    `update deals set title = ?, description = ?, amount_total = ?, commission_amount = ?,
       proposed_by_profile_id = ?, status = 'negotiating', updated_at = ? where id = ?`,
    [
      input.title.trim(),
      input.description.trim(),
      input.amountTotal,
      calcCommissionAmount(input.amountTotal, deal.commission_pct),
      viewer.id,
      now,
      input.dealId,
    ]
  );
  exec(db, "delete from deal_milestones where deal_id = ?", [input.dealId]);
  insertMilestones(db, input.dealId, input.milestones);
  exec(db, "update contracts set content = ?, sponsor_accepted_at = null, sponsee_accepted_at = null where deal_id = ?", [
    JSON.stringify(buildContractContent(db, input.dealId)),
    input.dealId,
  ]);
}

/** Statuswechsel — 1:1 aus advance_deal_status(). */
export function advanceDealStatus(
  db: SqlDatabase,
  viewer: Profile,
  dealId: string,
  newStatus: DealStatus,
  reason?: string | null
): void {
  const deal = selectOne<Deal>(db, "select * from deals where id = ?", [dealId]);
  if (!deal || (viewer.id !== deal.sponsor_profile_id && viewer.id !== deal.sponsee_profile_id)) {
    throw new DealError("Deal nicht gefunden oder kein Zugriff.");
  }
  if (!DEAL_TRANSITIONS[deal.status].includes(newStatus)) {
    throw new DealError(`Statuswechsel ${deal.status} → ${newStatus} ist nicht erlaubt.`);
  }
  if (newStatus === "declined" && viewer.id === deal.proposed_by_profile_id) {
    throw new DealError("Das eigene Angebot kann nicht abgelehnt werden — nutze Stornieren.");
  }
  if (newStatus === "cancelled" && (!reason || reason.trim() === "")) {
    throw new DealError("Zum Stornieren braucht es eine Begründung.");
  }
  if (newStatus === "agreed") {
    const contract = selectOne<Contract>(db, "select * from contracts where deal_id = ?", [dealId]);
    if (!contract?.sponsor_accepted_at || !contract?.sponsee_accepted_at) {
      throw new DealError("Beide Seiten müssen dem Vertrag zustimmen, bevor der Deal zustande kommt.");
    }
  }
  if (newStatus === "completed") {
    const openMilestones = select(
      db,
      "select id from deal_milestones where deal_id = ? and status not in ('approved','paid')",
      [dealId]
    );
    if (openMilestones.length > 0) {
      throw new DealError("Alle Meilensteine müssen freigegeben sein, bevor der Deal abgeschlossen werden kann.");
    }
  }

  exec(db, "update deals set status = ?, cancelled_reason = ?, updated_at = ? where id = ?", [
    newStatus,
    newStatus === "cancelled" ? (reason ?? "").trim() : deal.cancelled_reason,
    nowIso(),
    dealId,
  ]);
}

/** Vertragszustimmung — 1:1 aus accept_contract(); löst bei beidseitiger Zustimmung 'agreed' aus. */
export function acceptContract(db: SqlDatabase, viewer: Profile, dealId: string): void {
  const deal = selectOne<Deal>(db, "select * from deals where id = ?", [dealId]);
  if (!deal || (viewer.id !== deal.sponsor_profile_id && viewer.id !== deal.sponsee_profile_id)) {
    throw new DealError("Deal nicht gefunden oder kein Zugriff.");
  }
  if (!["offered", "negotiating"].includes(deal.status)) {
    throw new DealError(`In Status ${deal.status} kann dem Vertrag nicht zugestimmt werden.`);
  }
  const contract = selectOne<Contract>(db, "select * from contracts where deal_id = ?", [dealId]);
  if (!contract) throw new DealError("Zum Deal existiert kein Vertrag.");

  const isSponsor = viewer.id === deal.sponsor_profile_id;
  if ((isSponsor && contract.sponsor_accepted_at) || (!isSponsor && contract.sponsee_accepted_at)) {
    throw new DealError("Du hast dem Vertrag bereits zugestimmt.");
  }

  const now = nowIso();
  if (isSponsor) {
    exec(db, "update contracts set sponsor_accepted_at = ? where deal_id = ?", [now, dealId]);
  } else {
    exec(db, "update contracts set sponsee_accepted_at = ? where deal_id = ?", [now, dealId]);
  }

  const updated = selectOne<Contract>(db, "select * from contracts where deal_id = ?", [dealId])!;
  if (updated.sponsor_accepted_at && updated.sponsee_accepted_at) {
    advanceDealStatus(db, viewer, dealId, "agreed");
  }
}

export type DealOverview = { deal: Deal; counterpart: Profile | null };

export function getDealOverviews(db: SqlDatabase, myProfileId: string): DealOverview[] {
  const deals = select<Deal>(
    db,
    "select * from deals where sponsor_profile_id = ? or sponsee_profile_id = ? order by updated_at desc",
    [myProfileId, myProfileId]
  );
  return deals.map((deal) => {
    const counterpartId = deal.sponsor_profile_id === myProfileId ? deal.sponsee_profile_id : deal.sponsor_profile_id;
    return { deal, counterpart: selectOne<Profile>(db, "select * from profiles where id = ?", [counterpartId]) };
  });
}

export type DealDetail = {
  deal: Deal;
  milestones: DealMilestone[];
  contract: Contract | null;
  counterpart: Profile | null;
};

export function loadDealDetail(db: SqlDatabase, dealId: string, myProfileId: string): DealDetail | null {
  const deal = selectOne<Deal>(db, "select * from deals where id = ?", [dealId]);
  if (!deal) return null;
  const milestones = select<DealMilestone>(db, "select * from deal_milestones where deal_id = ? order by position", [
    dealId,
  ]);
  const contractRow = selectOne<Contract & { content: string }>(db, "select * from contracts where deal_id = ?", [dealId]);
  const contract: Contract | null = contractRow
    ? { ...contractRow, content: JSON.parse(contractRow.content as unknown as string) }
    : null;
  const counterpartId = deal.sponsor_profile_id === myProfileId ? deal.sponsee_profile_id : deal.sponsor_profile_id;
  const counterpart = selectOne<Profile>(db, "select * from profiles where id = ?", [counterpartId]);
  return { deal, milestones, contract, counterpart };
}

/** Offener Deal einer Konversation (für den Chat-CTA); null, wenn keiner läuft. */
export function getOpenDealForConversation(db: SqlDatabase, conversationId: string): Deal | null {
  const placeholders = DEAL_CLOSED_STATUSES.map(() => "?").join(",");
  return selectOne<Deal>(
    db,
    `select * from deals where conversation_id = ? and status not in (${placeholders}) limit 1`,
    [conversationId, ...DEAL_CLOSED_STATUSES]
  );
}
