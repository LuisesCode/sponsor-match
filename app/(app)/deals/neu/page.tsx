import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";

import { proposeDeal } from "../actions";
import { getCommissionPct, getOpenDealForConversation } from "../data";
import { DealForm } from "../DealForm";

export const metadata: Metadata = { title: "Deal vorschlagen — SponsorMatch" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * „Deal vorschlagen" aus einer Konversation heraus (M5): Konditionen und
 * Meilensteine festlegen; Vertrag + Provisions-Einfrieren übernimmt die DB.
 */
export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  const { conversation: conversationId } = await searchParams;
  if (!conversationId || !UUID_RE.test(conversationId)) notFound();

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.onboarding_completed) redirect("/onboarding");

  const supabase = await createClient();
  // RLS: nur Beteiligte sehen die Konversation.
  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conversation) notFound();

  const openDeal = await getOpenDealForConversation(conversationId);
  if (openDeal) redirect(`/deals/${openDeal.id}`);

  const counterpartId =
    conversation.sponsor_profile_id === profile.id
      ? conversation.sponsee_profile_id
      : conversation.sponsor_profile_id;
  const [{ data: counterpart }, commissionPct] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", counterpartId).maybeSingle(),
    getCommissionPct(),
  ]);

  return (
    <div style={{ maxWidth: "var(--container-sm)", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <div>
        <Link
          href={`/nachrichten/${conversationId}`}
          style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}
        >
          ← Zurück zum Chat
        </Link>
        <h1 style={{ margin: "var(--space-3) 0 0", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--fs-3xl)", letterSpacing: "-0.03em" }}>
          Deal vorschlagen
        </h1>
        <p style={{ margin: "var(--space-2) 0 0", color: "var(--text-muted)" }}>
          Dein Angebot an {counterpart?.display_name ?? "die Gegenseite"} — nach dem Absenden
          kann die Gegenseite annehmen, ablehnen oder ein Gegenangebot machen. Der Vertrag
          wird automatisch aus deinen Konditionen befüllt.
        </p>
      </div>

      <Card>
        <DealForm
          action={proposeDeal}
          hiddenFields={{ conversationId }}
          submitLabel="Deal vorschlagen"
          commissionPct={commissionPct}
        />
      </Card>
    </div>
  );
}
