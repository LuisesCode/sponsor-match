"use client";

import * as React from "react";

import { Avatar } from "@/components/ui/Avatar";
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

import { updateProfile } from "./actions";
import { initialProfileEditFormState } from "./form-state";

const REGION_OPTIONS: SelectOption[] = REGIONS.map(([value, label]) => ({ value, label }));

/** Vorbelegungen — alles bereits als Eingabe-Strings aufbereitet (Euro statt Cent). */
export interface ProfileEditDefaults {
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  region: string;
  website: string;
  ageGroups: string[];
  interests: string;
  // Sponsor
  companyName?: string;
  industryId?: string;
  companySize?: string;
  budgetMin?: string;
  budgetMax?: string;
  vatId?: string;
  // Sponsee
  type?: SponseeType;
  categoryId?: string;
  reachTotal?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  pastSponsors?: string;
  priceMin?: string;
  priceMax?: string;
  hasMediaKit?: boolean;
}

export interface ProfileEditFormProps {
  role: ProfileRole;
  defaults: ProfileEditDefaults;
  sportOptions: SelectOption[];
  industryOptions: SelectOption[];
  creatorNicheOptions: SelectOption[];
}

/** Profil bearbeiten — ein flaches Formular mit denselben Feldern wie das Onboarding. */
export function ProfileEditForm({
  role,
  defaults,
  sportOptions,
  industryOptions,
  creatorNicheOptions,
}: ProfileEditFormProps) {
  const [state, formAction, pending] = React.useActionState(
    updateProfile,
    initialProfileEditFormState
  );
  const [sponseeType, setSponseeType] = React.useState<SponseeType>(defaults.type ?? "athlete");
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);

  const fieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const firstError = (key: string): string | undefined => fieldErrors[key]?.[0];

  const categoryOptions = sponseeType === "creator" ? creatorNicheOptions : sportOptions;

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* ---- Basis & Avatar ---- */}
      <Card padding="lg" style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        <h2 style={{ fontSize: "var(--fs-h4)", margin: 0 }}>Profil</h2>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-5)", flexWrap: "wrap" }}>
          <Avatar
            name={defaults.displayName}
            src={avatarPreview ?? defaults.avatarUrl ?? undefined}
            size={72}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 220 }}>
            <label htmlFor="avatar" style={{ fontSize: "var(--fs-sm)", fontWeight: 600 }}>
              Avatar
            </label>
            <input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setAvatarPreview(file ? URL.createObjectURL(file) : null);
              }}
              style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}
            />
            <span style={{ fontSize: "var(--fs-xs)", color: firstError("avatar") ? "var(--danger)" : "var(--text-muted)" }}>
              {firstError("avatar") ?? "PNG, JPG oder WebP, max. 2 MB."}
            </span>
          </div>
        </div>

        <Input
          label="Anzeigename"
          name="displayName"
          required
          minLength={2}
          maxLength={80}
          defaultValue={defaults.displayName}
          error={firstError("displayName")}
        />
        <Select
          label="Region"
          name="region"
          required
          options={REGION_OPTIONS}
          defaultValue={defaults.region}
          placeholder="Region wählen …"
          error={firstError("region")}
        />
        <Textarea
          label={role === "sponsor" ? "Über das Unternehmen" : "Über dich"}
          name="bio"
          rows={5}
          maxLength={2000}
          defaultValue={defaults.bio}
          hint="Optional, max. 2000 Zeichen."
          error={firstError("bio")}
        />
        <Input
          label="Website"
          name="website"
          type="url"
          inputMode="url"
          placeholder="https://…"
          defaultValue={defaults.website}
          hint="Optional."
          error={firstError("website")}
        />
      </Card>

      {/* ---- Rollenfelder ---- */}
      {role === "sponsor" && (
        <Card padding="lg" style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          <h2 style={{ fontSize: "var(--fs-h4)", margin: 0 }}>Unternehmen & Budget</h2>
          <Input
            label="Firmenname"
            name="companyName"
            required
            minLength={2}
            maxLength={120}
            defaultValue={defaults.companyName ?? ""}
            error={firstError("companyName")}
          />
          <Select
            label="Branche"
            name="industryId"
            required
            options={industryOptions}
            defaultValue={defaults.industryId ?? ""}
            placeholder="Branche wählen …"
            error={firstError("industryId")}
          />
          <Select
            label="Unternehmensgröße"
            name="companySize"
            options={COMPANY_SIZES.map((s) => ({ value: s, label: `${s} Mitarbeitende` }))}
            defaultValue={defaults.companySize ?? ""}
            placeholder="Mitarbeiterzahl wählen …"
            hint="Optional."
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
            <Input
              label="Budget pro Deal (min., €)"
              name="budgetMin"
              inputMode="decimal"
              defaultValue={defaults.budgetMin ?? ""}
              hint="Optional."
              error={firstError("budgetMin")}
            />
            <Input
              label="Budget pro Deal (max., €)"
              name="budgetMax"
              inputMode="decimal"
              defaultValue={defaults.budgetMax ?? ""}
              hint="Optional."
              error={firstError("budgetMax")}
            />
          </div>
          <Input
            label="USt-IdNr."
            name="vatId"
            maxLength={20}
            defaultValue={defaults.vatId ?? ""}
            hint="Optional — für Rechnungen."
            error={firstError("vatId")}
          />
        </Card>
      )}

      {role === "sponsee" && (
        <Card padding="lg" style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          <h2 style={{ fontSize: "var(--fs-h4)", margin: 0 }}>Kategorie & Reichweite</h2>
          <div>
            <span style={{ display: "block", fontSize: "var(--fs-sm)", fontWeight: 600, marginBottom: 8 }}>
              Wer bist du? <span style={{ color: "var(--danger)" }}>*</span>
            </span>
            <RadioGroup
              name="type"
              value={sponseeType}
              onChange={(e) => setSponseeType(e.target.value as SponseeType)}
            >
              <Radio value="athlete" label={SPONSEE_TYPE_LABELS.athlete} />
              <Radio value="club" label={SPONSEE_TYPE_LABELS.club} />
              <Radio value="creator" label={SPONSEE_TYPE_LABELS.creator} />
            </RadioGroup>
          </div>
          <Select
            label={sponseeType === "creator" ? "Deine Nische" : "Deine Sportart"}
            name="categoryId"
            required
            options={categoryOptions}
            defaultValue={defaults.categoryId ?? ""}
            placeholder="Kategorie wählen …"
            error={firstError("categoryId")}
          />
          <Input
            label="Gesamtreichweite (Follower über alle Kanäle)"
            name="reachTotal"
            inputMode="numeric"
            defaultValue={defaults.reachTotal ?? ""}
            hint="Optional — Schätzung reicht."
            error={firstError("reachTotal")}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
            <Input
              label="Preis pro Deal (ab, €)"
              name="priceMin"
              inputMode="decimal"
              defaultValue={defaults.priceMin ?? ""}
              hint="Optional."
              error={firstError("priceMin")}
            />
            <Input
              label="Preis pro Deal (bis, €)"
              name="priceMax"
              inputMode="decimal"
              defaultValue={defaults.priceMax ?? ""}
              hint="Optional."
              error={firstError("priceMax")}
            />
          </div>
          <Input
            label="Instagram"
            name="instagram"
            type="url"
            inputMode="url"
            defaultValue={defaults.instagram ?? ""}
            hint="Optional."
            error={firstError("instagram")}
          />
          <Input
            label="TikTok"
            name="tiktok"
            type="url"
            inputMode="url"
            defaultValue={defaults.tiktok ?? ""}
            hint="Optional."
            error={firstError("tiktok")}
          />
          <Input
            label="YouTube"
            name="youtube"
            type="url"
            inputMode="url"
            defaultValue={defaults.youtube ?? ""}
            hint="Optional."
            error={firstError("youtube")}
          />
          <Input
            label="Bisherige Sponsoren"
            name="pastSponsors"
            defaultValue={defaults.pastSponsors ?? ""}
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
              {firstError("mediaKit") ??
                (defaults.hasMediaKit
                  ? "Ein Mediakit ist hinterlegt — ein neuer Upload ersetzt es."
                  : "Optional, max. 10 MB — sichtbar für eingeloggte Sponsoren.")}
            </span>
          </div>
        </Card>
      )}

      {/* ---- Zielgruppe ---- */}
      {role !== "admin" && (
        <Card padding="lg" style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          <h2 style={{ fontSize: "var(--fs-h4)", margin: 0 }}>Zielgruppe</h2>
          <div>
            <span style={{ display: "block", fontSize: "var(--fs-sm)", fontWeight: 600, marginBottom: 8 }}>
              {role === "sponsor" ? "Welche Altersgruppen wollt ihr erreichen?" : "Wie alt ist dein Publikum überwiegend?"}
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)" }}>
              {AGE_GROUPS.map((g) => (
                <Checkbox
                  key={g}
                  name="ageGroups"
                  value={g}
                  label={g}
                  defaultChecked={defaults.ageGroups.includes(g)}
                />
              ))}
            </div>
          </div>
          <Input
            label={role === "sponsor" ? "Interessen der Zielgruppe" : "Interessen deines Publikums"}
            name="interests"
            defaultValue={defaults.interests}
            placeholder="z.B. Fitness, Ernährung, Outdoor"
            hint="Optional — durch Komma getrennt, max. 12."
            error={firstError("interests")}
          />
        </Card>
      )}

      {/* ---- Feedback & Submit ---- */}
      {state.status === "error" && (
        <p role="alert" style={{ margin: 0, color: "var(--danger)", fontSize: "var(--fs-sm)", fontWeight: 600 }}>
          {state.message ?? "Bitte prüf die markierten Felder — einige Angaben fehlen oder sind ungültig."}
        </p>
      )}
      {state.status === "success" && (
        <Badge tone="success" style={{ alignSelf: "flex-start" }}>
          Gespeichert — dein Profil ist aktuell.
        </Badge>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button type="submit" variant="primary" loading={pending} disabled={pending}>
          Profil speichern
        </Button>
      </div>
    </form>
  );
}
