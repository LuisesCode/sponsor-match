"use client";

import * as React from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { ProfileRole } from "@/lib/supabase/types";
import { LISTING_DIRECTION_LABELS } from "@/lib/validation/listing";
import { REGIONS } from "@/lib/validation/onboarding";

import { createListing } from "../actions";
import { initialListingFormState } from "../form-state";

const REGION_OPTIONS: SelectOption[] = REGIONS.map(([value, label]) => ({ value, label }));

export interface ListingFormProps {
  role: Exclude<ProfileRole, "admin">;
  categoryOptions: SelectOption[];
}

/** Formular für ein neues Listing; die direction ergibt sich aus der Rolle. */
export function ListingForm({ role, categoryOptions }: ListingFormProps) {
  const [state, formAction, pending] = React.useActionState(
    createListing,
    initialListingFormState
  );

  const fieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const firstError = (key: string): string | undefined => fieldErrors[key]?.[0];

  const isSponsor = role === "sponsor";
  const direction = isSponsor ? "offering_sponsorship" : "seeking_sponsor";

  return (
    <form action={formAction}>
      <Card padding="lg" style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <Badge tone={isSponsor ? "primary" : "accent"}>{LISTING_DIRECTION_LABELS[direction]}</Badge>
          <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
            {isSponsor
              ? "Du bietest ein Sponsoring an — beschreib, wen ihr sucht."
              : "Du suchst einen Sponsor — beschreib, was du anbietest."}
          </span>
        </div>

        <Input
          name="title"
          label="Titel"
          required
          maxLength={120}
          placeholder={
            isSponsor
              ? "z.B. Trikotsponsoring für Amateurvereine in Bayern"
              : "z.B. Triathletin sucht Ausrüstungspartner für die Saison 2027"
          }
          error={firstError("title")}
        />

        <Textarea
          name="description"
          label="Beschreibung"
          required
          rows={6}
          maxLength={5000}
          placeholder="Was bietest du an, wen suchst du, welche Gegenleistungen sind möglich?"
          hint="Mindestens 20 Zeichen."
          error={firstError("description")}
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
          <Select
            name="categoryId"
            label="Kategorie"
            options={categoryOptions}
            placeholder="Kategorie wählen (optional)"
            defaultValue=""
            error={firstError("categoryId")}
          />
          <Select
            name="region"
            label="Region"
            options={REGION_OPTIONS}
            placeholder="Region wählen (optional)"
            defaultValue=""
            error={firstError("region")}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
          <Input
            name="budgetMin"
            label={isSponsor ? "Budget von (€)" : "Preisvorstellung von (€)"}
            inputMode="decimal"
            placeholder="z.B. 500"
            error={firstError("budgetMin")}
          />
          <Input
            name="budgetMax"
            label={isSponsor ? "Budget bis (€)" : "Preisvorstellung bis (€)"}
            inputMode="decimal"
            placeholder="z.B. 5.000"
            error={firstError("budgetMax")}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
          {isSponsor && (
            <Input
              name="reachRequired"
              label="Mindest-Reichweite"
              inputMode="numeric"
              placeholder="z.B. 10.000"
              hint="Follower/Mitglieder, die ein Partner mitbringen sollte."
              error={firstError("reachRequired")}
            />
          )}
          <Input
            name="expiresAt"
            label="Läuft ab am"
            type="date"
            hint="Optional — danach verschwindet das Listing aus dem Marktplatz."
            error={firstError("expiresAt")}
          />
          <Select
            name="status"
            label="Sichtbarkeit"
            defaultValue="active"
            options={[
              { value: "active", label: "Sofort veröffentlichen" },
              { value: "draft", label: "Als Entwurf speichern" },
            ]}
            error={firstError("status")}
          />
        </div>

        {state.status === "error" && state.message && (
          <p style={{ margin: 0, color: "var(--danger)", fontSize: "var(--fs-sm)", fontWeight: 600 }}>
            {state.message}
          </p>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button type="submit" variant="primary" loading={pending} disabled={pending}>
            Listing speichern
          </Button>
        </div>
      </Card>
    </form>
  );
}
