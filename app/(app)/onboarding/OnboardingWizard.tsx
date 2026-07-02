"use client";

import * as React from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Radio, RadioGroup } from "@/components/ui/Radio";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { ProfileRole, SponseeType } from "@/lib/supabase/types";
import {
  AGE_GROUPS,
  COMPANY_SIZES,
  REGIONS,
  SPONSEE_TYPE_LABELS,
} from "@/lib/validation/onboarding";

import { completeOnboarding } from "./actions";
import { initialOnboardingFormState } from "./form-state";

export interface OnboardingWizardProps {
  role: Exclude<ProfileRole, "admin">;
  displayName: string;
  sportOptions: SelectOption[];
  industryOptions: SelectOption[];
  creatorNicheOptions: SelectOption[];
}

const REGION_OPTIONS: SelectOption[] = REGIONS.map(([value, label]) => ({ value, label }));

const STEP_LABELS: Record<OnboardingWizardProps["role"], [string, string, string]> = {
  sponsor: ["Über euch", "Unternehmen & Budget", "Zielgruppe"],
  sponsee: ["Über dich", "Kategorie & Reichweite", "Kanäle & Mediakit"],
};

/**
 * Rollenspezifischer Onboarding-Wizard (3 Schritte, ein Formular).
 * Alle Schritte bleiben gemountet (display:none), damit die finale
 * FormData sämtliche Felder enthält; pro Schritt prüft HTML5-Validierung.
 */
export function OnboardingWizard({
  role,
  displayName,
  sportOptions,
  industryOptions,
  creatorNicheOptions,
}: OnboardingWizardProps) {
  const [state, formAction, pending] = React.useActionState(
    completeOnboarding,
    initialOnboardingFormState
  );
  const [step, setStep] = React.useState(0);
  const [sponseeType, setSponseeType] = React.useState<SponseeType>("athlete");
  const formRef = React.useRef<HTMLFormElement>(null);

  const labels = STEP_LABELS[role];
  const fieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const firstError = (key: string): string | undefined => fieldErrors[key]?.[0];

  /** HTML5-Validierung nur für die Felder des aktuellen Schritts. */
  const nextStep = () => {
    const container = formRef.current?.querySelector(`[data-step="${step}"]`);
    if (container) {
      const fields = container.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "input, select, textarea"
      );
      for (const field of fields) {
        if (!field.reportValidity()) return;
      }
    }
    setStep((s) => Math.min(s + 1, 2));
  };

  const categoryOptions = sponseeType === "creator" ? creatorNicheOptions : sportOptions;

  return (
    <form ref={formRef} action={formAction} noValidate={false}>
      {/* Schritt-Anzeige */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-6)", flexWrap: "wrap" }}>
        {labels.map((label, i) => (
          <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span
              aria-current={i === step ? "step" : undefined}
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: "var(--fs-xs)",
                background: i <= step ? "var(--primary)" : "var(--surface-3)",
                color: i <= step ? "var(--on-primary)" : "var(--text-muted)",
                transition: "background var(--dur-fast)",
              }}
            >
              {i + 1}
            </span>
            <span
              style={{
                fontSize: "var(--fs-sm)",
                fontWeight: 600,
                color: i === step ? "var(--text)" : "var(--text-muted)",
              }}
            >
              {label}
            </span>
            {i < 2 && <span style={{ width: 24, height: 1, background: "var(--border-strong)" }} />}
          </span>
        ))}
      </div>

      <Card padding="lg">
        {/* ---- Schritt 1: Basis (beide Rollen) ---- */}
        <div data-step="0" style={{ display: step === 0 ? "flex" : "none", flexDirection: "column", gap: "var(--space-5)" }}>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>
            Hallo {displayName}! Diese Angaben erscheinen später auf {role === "sponsor" ? "eurem" : "deinem"} öffentlichen Profil.
          </p>
          <Select
            label="Region"
            name="region"
            required
            placeholder="Region wählen …"
            defaultValue=""
            options={REGION_OPTIONS}
            error={firstError("region")}
          />
          <Textarea
            label={role === "sponsor" ? "Über das Unternehmen" : "Über dich"}
            name="bio"
            rows={5}
            maxLength={2000}
            placeholder={
              role === "sponsor"
                ? "Was macht euer Unternehmen? Welche Art von Partnerschaften sucht ihr?"
                : "Erzähl, wer du bist, was dich antreibt und wofür du stehst."
            }
            hint="Optional, max. 2000 Zeichen."
            error={firstError("bio")}
          />
          <Input
            label="Website"
            name="website"
            type="url"
            inputMode="url"
            placeholder="https://…"
            hint="Optional."
            error={firstError("website")}
          />
        </div>

        {/* ---- Schritt 2: rollenspezifisch ---- */}
        <div data-step="1" style={{ display: step === 1 ? "flex" : "none", flexDirection: "column", gap: "var(--space-5)" }}>
          {role === "sponsor" ? (
            <>
              <Input
                label="Firmenname"
                name="companyName"
                required
                minLength={2}
                maxLength={120}
                placeholder="z.B. NordSport GmbH"
                error={firstError("companyName")}
              />
              <Select
                label="Branche"
                name="industryId"
                required
                placeholder="Branche wählen …"
                defaultValue=""
                options={industryOptions}
                error={firstError("industryId")}
              />
              <Select
                label="Unternehmensgröße"
                name="companySize"
                placeholder="Mitarbeiterzahl wählen …"
                defaultValue=""
                options={COMPANY_SIZES.map((s) => ({ value: s, label: `${s} Mitarbeitende` }))}
                hint="Optional."
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <Input
                  label="Budget pro Deal (min., €)"
                  name="budgetMin"
                  inputMode="decimal"
                  placeholder="z.B. 500"
                  hint="Optional."
                  error={firstError("budgetMin")}
                />
                <Input
                  label="Budget pro Deal (max., €)"
                  name="budgetMax"
                  inputMode="decimal"
                  placeholder="z.B. 5.000"
                  hint="Optional."
                  error={firstError("budgetMax")}
                />
              </div>
              <Input
                label="USt-IdNr."
                name="vatId"
                maxLength={20}
                placeholder="z.B. DE123456789"
                hint="Optional — für Rechnungen. // Hinweis auf steuerliche Pflichten folgt beim Deal-Abschluss."
                error={firstError("vatId")}
              />
            </>
          ) : (
            <>
              <div>
                <span style={{ display: "block", fontSize: "var(--fs-sm)", fontWeight: 600, marginBottom: 8 }}>
                  Wer bist du? <span style={{ color: "var(--danger)" }}>*</span>
                </span>
                <RadioGroup
                  name="type"
                  value={sponseeType}
                  onChange={(e) => setSponseeType(e.target.value as SponseeType)}
                >
                  <Radio value="athlete" label={SPONSEE_TYPE_LABELS.athlete} description="Einzelsportler:in, vom Nachwuchs bis Profi" />
                  <Radio value="club" label={SPONSEE_TYPE_LABELS.club} description="Verein oder Mannschaft" />
                  <Radio value="creator" label={SPONSEE_TYPE_LABELS.creator} description="Content Creator:in / Influencer:in" />
                </RadioGroup>
              </div>
              <Select
                label={sponseeType === "creator" ? "Deine Nische" : "Deine Sportart"}
                name="categoryId"
                required
                placeholder="Kategorie wählen …"
                defaultValue=""
                options={categoryOptions}
                error={firstError("categoryId")}
              />
              <Input
                label="Gesamtreichweite (Follower über alle Kanäle)"
                name="reachTotal"
                inputMode="numeric"
                placeholder="z.B. 128.000"
                hint="Optional — Schätzung reicht."
                error={firstError("reachTotal")}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <Input
                  label="Preis pro Deal (ab, €)"
                  name="priceMin"
                  inputMode="decimal"
                  placeholder="z.B. 250"
                  hint="Optional."
                  error={firstError("priceMin")}
                />
                <Input
                  label="Preis pro Deal (bis, €)"
                  name="priceMax"
                  inputMode="decimal"
                  placeholder="z.B. 2.500"
                  hint="Optional."
                  error={firstError("priceMax")}
                />
              </div>
            </>
          )}
        </div>

        {/* ---- Schritt 3: Zielgruppe / Kanäle ---- */}
        <div data-step="2" style={{ display: step === 2 ? "flex" : "none", flexDirection: "column", gap: "var(--space-5)" }}>
          <div>
            <span style={{ display: "block", fontSize: "var(--fs-sm)", fontWeight: 600, marginBottom: 8 }}>
              {role === "sponsor" ? "Welche Altersgruppen wollt ihr erreichen?" : "Wie alt ist dein Publikum überwiegend?"}
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)" }}>
              {AGE_GROUPS.map((g) => (
                <Checkbox key={g} name="ageGroups" value={g} label={g} />
              ))}
            </div>
          </div>
          <Input
            label={role === "sponsor" ? "Interessen der Zielgruppe" : "Interessen deines Publikums"}
            name="interests"
            placeholder="z.B. Fitness, Ernährung, Outdoor"
            hint="Optional — durch Komma getrennt, max. 12."
            error={firstError("interests")}
          />
          {role === "sponsee" && (
            <>
              <Input label="Instagram" name="instagram" type="url" inputMode="url" placeholder="https://instagram.com/…" hint="Optional." error={firstError("instagram")} />
              <Input label="TikTok" name="tiktok" type="url" inputMode="url" placeholder="https://tiktok.com/@…" hint="Optional." error={firstError("tiktok")} />
              <Input label="YouTube" name="youtube" type="url" inputMode="url" placeholder="https://youtube.com/@…" hint="Optional." error={firstError("youtube")} />
              <Input
                label="Bisherige Sponsoren"
                name="pastSponsors"
                placeholder="z.B. Adidas, Rewe"
                hint="Optional — durch Komma getrennt."
                error={firstError("pastSponsors")}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label htmlFor="mediaKit" style={{ fontSize: "var(--fs-sm)", fontWeight: 600 }}>
                  Mediakit (PDF)
                </label>
                <input
                  id="mediaKit"
                  name="mediaKit"
                  type="file"
                  accept="application/pdf"
                  style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}
                />
                <span style={{ fontSize: "var(--fs-xs)", color: firstError("mediaKit") ? "var(--danger)" : "var(--text-muted)" }}>
                  {firstError("mediaKit") ?? "Optional, max. 10 MB — sichtbar für eingeloggte Sponsoren."}
                </span>
              </div>
            </>
          )}
          <Badge tone="accent" icon={undefined} style={{ alignSelf: "flex-start" }}>
            Alle Angaben kannst du später jederzeit ändern.
          </Badge>
        </div>

        {/* ---- Fehlermeldung & Navigation ---- */}
        {state.status === "error" && state.message && (
          <p role="alert" style={{ color: "var(--danger)", fontSize: "var(--fs-sm)", margin: "var(--space-4) 0 0" }}>
            {state.message}
          </p>
        )}
        {state.status === "error" && !state.message && (
          <p role="alert" style={{ color: "var(--danger)", fontSize: "var(--fs-sm)", margin: "var(--space-4) 0 0" }}>
            Bitte prüf die markierten Felder — einige Angaben fehlen oder sind ungültig.
          </p>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", marginTop: "var(--space-6)" }}>
          <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(s - 1, 0))} style={{ visibility: step === 0 ? "hidden" : "visible" }}>
            Zurück
          </Button>
          {step < 2 ? (
            <Button type="button" variant="primary" onClick={nextStep}>
              Weiter
            </Button>
          ) : (
            <Button type="submit" variant="primary" loading={pending} disabled={pending}>
              Profil speichern & loslegen
            </Button>
          )}
        </div>
      </Card>
    </form>
  );
}
