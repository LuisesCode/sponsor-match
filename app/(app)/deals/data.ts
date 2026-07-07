import { createClient } from "@/lib/supabase/server";
import type { Contract, Deal, DealMilestone, Profile } from "@/lib/supabase/types";

/** Eintrag der Deal-Liste auf /deals. */
export type DealOverview = {
  deal: Deal;
  /** Profil der Gegenseite (null, falls gelöscht). */
  counterpart: Profile | null;
};

/** Deals des Nutzers (RLS begrenzt auf Beteiligte), neueste Aktivität zuerst. */
export async function getDealOverviews(myProfileId: string): Promise<DealOverview[]> {
  const supabase = await createClient();

  const { data: deals, error } = await supabase
    .from("deals")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error || !deals || deals.length === 0) {
    if (error) console.error("Deals laden fehlgeschlagen:", error);
    return [];
  }

  const counterpartIds = deals.map((d) =>
    d.sponsor_profile_id === myProfileId ? d.sponsee_profile_id : d.sponsor_profile_id
  );
  const { data: profiles } = await supabase.from("profiles").select("*").in("id", counterpartIds);
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return deals.map((deal) => ({
    deal,
    counterpart:
      profileById.get(
        deal.sponsor_profile_id === myProfileId ? deal.sponsee_profile_id : deal.sponsor_profile_id
      ) ?? null,
  }));
}

/** Vollständige Daten für /deals/[id]. */
export type DealDetail = {
  deal: Deal;
  milestones: DealMilestone[];
  contract: Contract | null;
  counterpart: Profile | null;
};

export async function loadDealDetail(dealId: string): Promise<DealDetail | null> {
  const supabase = await createClient();

  // RLS: nur Beteiligte sehen den Deal.
  const { data: deal } = await supabase.from("deals").select("*").eq("id", dealId).maybeSingle();
  if (!deal) return null;

  const [{ data: milestones }, { data: contract }] = await Promise.all([
    supabase
      .from("deal_milestones")
      .select("*")
      .eq("deal_id", dealId)
      .order("position", { ascending: true }),
    supabase.from("contracts").select("*").eq("deal_id", dealId).maybeSingle(),
  ]);

  return { deal, milestones: milestones ?? [], contract: contract ?? null, counterpart: null };
}

/** Gegenseite eines Deals aus Sicht von myProfileId nachladen. */
export async function loadDealCounterpart(
  deal: Deal,
  myProfileId: string
): Promise<Profile | null> {
  const supabase = await createClient();
  const counterpartId =
    deal.sponsor_profile_id === myProfileId ? deal.sponsee_profile_id : deal.sponsor_profile_id;
  const { data } = await supabase.from("profiles").select("*").eq("id", counterpartId).maybeSingle();
  return data ?? null;
}

/** Offener Deal einer Konversation (für den Chat-CTA); null, wenn keiner läuft. */
export async function getOpenDealForConversation(conversationId: string): Promise<Deal | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .eq("conversation_id", conversationId)
    .not("status", "in", "(declined,cancelled,completed)")
    .maybeSingle();
  if (error) {
    // Tabelle fehlt (Migration noch nicht angewendet) → CTA degradiert sauber.
    console.error("Offenen Deal laden fehlgeschlagen:", error);
    return null;
  }
  return data ?? null;
}

/** Aktueller Provisionssatz fürs Formular (null, wenn nicht lesbar). */
export async function getCommissionPct(): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_commission_pct");
  if (error || data == null) {
    if (error) console.error("Provisionssatz laden fehlgeschlagen:", error);
    return null;
  }
  return Number(data);
}
