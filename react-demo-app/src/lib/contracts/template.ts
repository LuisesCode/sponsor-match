import { formatCents, formatDate } from "@/lib/format";
import type { ContractContent } from "@/lib/types";

/**
 * Flenzko — Vertragsvorlage v1 (M5).
 * contracts.content ist ein strukturierter Snapshot der Deal-Konditionen
 * (von public.build_contract_content() befüllt); dieses Modul rendert daraus
 * den anzeigbaren Vertragstext. Neue Fassungen bekommen eine neue
 * template_version, bestehende Verträge bleiben mit ihrer Version lesbar.
 *
 * // TODO: rechtlich prüfen — Vorlage & Wirksamkeit der digitalen Zustimmung
 * // (vgl. PLAN.md §3 contracts) vor Launch vom Anwalt freigeben lassen.
 */

export const CONTRACT_TEMPLATE_VERSION = "v1";

export type ContractSection = {
  heading: string;
  paragraphs: string[];
};

/** Vertragsparteien als Anzeigename ("NordSport GmbH (NordSport Test GmbH)"). */
function sponsorName(content: ContractContent): string {
  const { display_name, company_name } = content.sponsor;
  if (company_name && company_name !== display_name) {
    return `${company_name} (Profil: ${display_name})`;
  }
  return company_name ?? display_name;
}

/** Rendert den Vertragstext der Vorlage v1 aus dem content-Snapshot. */
export function renderContractSections(content: ContractContent): ContractSection[] {
  const { deal, sponsee } = content;
  const sponsor = sponsorName(content);

  const milestoneLines = content.milestones.map((m) => {
    const due = m.due_date ? `, fällig zum ${formatDate(m.due_date)}` : "";
    return `${m.position}. ${m.title} — ${formatCents(m.amount)}${due}`;
  });

  return [
    {
      heading: "§ 1 Vertragsparteien",
      paragraphs: [
        `Sponsor: ${sponsor}.`,
        `Gesponserte:r: ${sponsee.display_name}.`,
        "Die Identität beider Parteien ergibt sich aus den verifizierten Flenzko-Profilen zum Zeitpunkt der Zustimmung.",
      ],
    },
    {
      heading: "§ 2 Vertragsgegenstand",
      paragraphs: [
        `Gegenstand dieser Vereinbarung ist das Sponsoring „${deal.title}".`,
        deal.description,
      ],
    },
    {
      heading: "§ 3 Vergütung und Provision",
      paragraphs: [
        `Der Sponsor zahlt eine Gesamtvergütung von ${formatCents(deal.amount_total)} (inkl. aller Meilensteine).`,
        `Die Plattformprovision beträgt ${String(deal.commission_pct).replace(".", ",")} % (${formatCents(deal.commission_amount)}) und wird von der Vergütung des Gesponserten einbehalten. Auszahlungsbetrag an den Gesponserten: ${formatCents(deal.payout_amount)}.`,
        "Der Provisionssatz wurde bei Vertragsschluss eingefroren und ändert sich für diesen Deal nicht mehr.",
      ],
    },
    {
      heading: "§ 4 Meilensteine und Fälligkeiten",
      paragraphs: [
        "Die Leistungen werden in folgenden Meilensteinen erbracht und abgerechnet:",
        ...milestoneLines,
      ],
    },
    {
      heading: "§ 5 Zahlungsabwicklung",
      paragraphs: [
        "Die Zahlung erfolgt über die Flenzko-Plattform: Der Sponsor zahlt die Gesamtvergütung sicher ins Escrow ein; die Auszahlung je Meilenstein erfolgt erst nach dessen Freigabe durch den Sponsor.",
      ],
    },
    {
      heading: "§ 6 Zustandekommen und Beendigung",
      paragraphs: [
        "Dieser Vertrag kommt zustande, sobald beide Parteien ihm digital über die Plattform zugestimmt haben. Ändert eine Partei das Angebot (Gegenangebot), erlöschen bereits erteilte Zustimmungen und der geänderte Vertrag muss erneut von beiden Seiten bestätigt werden.",
        "Bis zur Einzahlung ins Escrow kann der Deal mit Begründung storniert werden; danach gelten die Streitfall-Regeln der Plattform.",
      ],
    },
  ];
}
