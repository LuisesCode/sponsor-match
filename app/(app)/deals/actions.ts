"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import type { DealMilestoneInput } from "@/lib/supabase/types";
import {
  cancelDealSchema,
  counterDealSchema,
  dealIdSchema,
  declineDealSchema,
  parseMilestonesJson,
  proposeDealSchema,
  sumMilestoneAmounts,
} from "@/lib/validation/deal";

import type { DealActionState, DealFormState } from "./form-state";

const GENERIC_ERROR =
  "Die Aktion konnte nicht ausgeführt werden. Bitte versuch es gleich noch einmal.";

/**
 * P0001 = raise exception aus unseren Deal-Funktionen — die Meldungen sind
 * deutsch und für Nutzer formuliert; alles andere bleibt generisch.
 */
function dbErrorMessage(error: { code?: string; message?: string } | null): string {
  if (error?.code === "P0001" && error.message) return error.message;
  return GENERIC_ERROR;
}

function toMilestonesParam(
  milestones: { title: string; amount: number; dueDate: string | null }[]
): DealMilestoneInput[] {
  return milestones.map((m) => ({
    title: m.title,
    amount: m.amount,
    due_date: m.dueDate,
  }));
}

/** „Deal vorschlagen" aus dem Chat: legt Deal + Meilensteine + Vertrag an. */
export async function proposeDeal(
  _prev: DealFormState,
  formData: FormData
): Promise<DealFormState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.onboarding_completed) redirect("/onboarding");

  const parsed = proposeDealSchema.safeParse({
    conversationId: formData.get("conversationId"),
    title: formData.get("title"),
    description: formData.get("description"),
    milestones: parseMilestonesJson(formData.get("milestones")),
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const { data: dealId, error } = await supabase.rpc("create_deal", {
    p_conversation_id: d.conversationId,
    p_title: d.title,
    p_description: d.description,
    p_amount_total: sumMilestoneAmounts(d.milestones),
    p_milestones: toMilestonesParam(d.milestones),
  });

  if (error || !dealId) {
    console.error("Deal vorschlagen fehlgeschlagen:", error);
    return { status: "error", message: dbErrorMessage(error) };
  }

  revalidatePath("/deals");
  revalidatePath(`/nachrichten/${d.conversationId}`);
  redirect(`/deals/${dealId}`);
}

/** Gegenangebot: ersetzt Konditionen + Meilensteine, setzt Zustimmungen zurück. */
export async function counterDeal(
  _prev: DealFormState,
  formData: FormData
): Promise<DealFormState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const parsed = counterDealSchema.safeParse({
    dealId: formData.get("dealId"),
    title: formData.get("title"),
    description: formData.get("description"),
    milestones: parseMilestonesJson(formData.get("milestones")),
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("counter_deal_offer", {
    p_deal_id: d.dealId,
    p_title: d.title,
    p_description: d.description,
    p_amount_total: sumMilestoneAmounts(d.milestones),
    p_milestones: toMilestonesParam(d.milestones),
  });

  if (error) {
    console.error("Gegenangebot fehlgeschlagen:", error);
    return { status: "error", message: dbErrorMessage(error) };
  }

  revalidatePath("/deals");
  redirect(`/deals/${d.dealId}`);
}

/** Digitale Zustimmung zum Vertrag; bei beidseitiger Zustimmung → agreed. */
export async function acceptContract(
  _prev: DealActionState,
  formData: FormData
): Promise<DealActionState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const parsed = dealIdSchema.safeParse({ dealId: formData.get("dealId") });
  if (!parsed.success) return { status: "error", message: GENERIC_ERROR };

  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_contract", {
    p_deal_id: parsed.data.dealId,
  });
  if (error) {
    console.error("Vertragszustimmung fehlgeschlagen:", error);
    return { status: "error", message: dbErrorMessage(error) };
  }

  revalidatePath("/deals");
  revalidatePath(`/deals/${parsed.data.dealId}`);
  return { status: "success" };
}

/** Angebot ablehnen (nur die Gegenseite des aktuellen Angebots). */
export async function declineDeal(
  _prev: DealActionState,
  formData: FormData
): Promise<DealActionState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const parsed = declineDealSchema.safeParse({ dealId: formData.get("dealId") });
  if (!parsed.success) return { status: "error", message: GENERIC_ERROR };

  const supabase = await createClient();
  const { error } = await supabase.rpc("advance_deal_status", {
    p_deal_id: parsed.data.dealId,
    p_new_status: "declined",
  });
  if (error) {
    console.error("Deal ablehnen fehlgeschlagen:", error);
    return { status: "error", message: dbErrorMessage(error) };
  }

  revalidatePath("/deals");
  revalidatePath(`/deals/${parsed.data.dealId}`);
  return { status: "success" };
}

/** Deal stornieren (vor Escrow, mit Begründung). */
export async function cancelDeal(
  _prev: DealActionState,
  formData: FormData
): Promise<DealActionState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const parsed = cancelDealSchema.safeParse({
    dealId: formData.get("dealId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Bitte gib eine Begründung (mind. 5 Zeichen) an.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("advance_deal_status", {
    p_deal_id: parsed.data.dealId,
    p_new_status: "cancelled",
    p_reason: parsed.data.reason,
  });
  if (error) {
    console.error("Deal stornieren fehlgeschlagen:", error);
    return { status: "error", message: dbErrorMessage(error) };
  }

  revalidatePath("/deals");
  revalidatePath(`/deals/${parsed.data.dealId}`);
  return { status: "success" };
}
