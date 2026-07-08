import * as React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useSession } from "@/auth/SessionContext";
import { getDb } from "@/db/client";
import { listCategories } from "@/db/repositories/categories";
import { createListing } from "@/db/repositories/listings";
import { LISTING_DIRECTION_LABELS, listingSchema } from "@/lib/validation/listing";
import { REGIONS } from "@/lib/validation/onboarding";
import type { Region } from "@/lib/types";

const REGION_OPTIONS: SelectOption[] = REGIONS.map(([value, label]) => ({ value, label }));

type FieldErrors = Partial<Record<string, string[]>>;

/** Neues Listing — Struktur 1:1 aus app/(app)/listings/neu/ListingForm.tsx. */
export default function ListingNew() {
  const { profile } = useSession();
  const navigate = useNavigate();
  const [categoryOptions, setCategoryOptions] = React.useState<SelectOption[]>([]);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [message, setMessage] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      const db = await getDb();
      const sport = listCategories(db, "sport").map((c) => ({ value: c.id, label: c.name }));
      const creator = listCategories(db, "creator_niche").map((c) => ({
        value: c.id,
        label: `Creator: ${c.name}`,
      }));
      setCategoryOptions([...sport, ...creator]);
    })();
  }, []);

  if (!profile || profile.role === "admin") return <Navigate to="/listings" replace />;
  const isSponsor = profile.role === "sponsor";
  const direction = isSponsor ? "offering_sponsorship" : "seeking_sponsor";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const parsed = listingSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      categoryId: formData.get("categoryId") ?? "",
      region: formData.get("region") ?? "",
      budgetMin: formData.get("budgetMin"),
      budgetMax: formData.get("budgetMax"),
      reachRequired: formData.get("reachRequired"),
      expiresAt: formData.get("expiresAt"),
      status: formData.get("status") ?? "active",
    });
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as FieldErrors);
      setPending(false);
      return;
    }

    const d = parsed.data;
    const db = await getDb();
    try {
      const listing = createListing(db, {
        authorProfileId: profile.id,
        direction,
        title: d.title,
        description: d.description,
        categoryId: d.categoryId,
        region: d.region as Region | null,
        budgetMin: d.budgetMin,
        budgetMax: d.budgetMax,
        reachRequired: d.reachRequired,
        status: d.status,
        expiresAt: d.expiresAt ? new Date(d.expiresAt + "T23:59:59").toISOString() : null,
      });
      navigate(`/listings/${listing.id}`);
    } catch {
      setMessage("Dein Listing konnte nicht gespeichert werden. Bitte versuch es gleich noch einmal.");
      setPending(false);
    }
  };

  return (
    <div style={{ maxWidth: "var(--container-sm)", margin: "0 auto" }}>
      <span className="fk-eyebrow">Marktplatz</span>
      <h1 style={{ fontSize: "var(--fs-h1)", margin: "var(--space-2) 0 var(--space-6)" }}>Neues Listing</h1>

      <form onSubmit={handleSubmit} noValidate>
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
            error={fieldErrors.title?.[0]}
          />

          <Textarea
            name="description"
            label="Beschreibung"
            required
            rows={6}
            maxLength={5000}
            placeholder="Was bietest du an, wen suchst du, welche Gegenleistungen sind möglich?"
            hint="Mindestens 20 Zeichen."
            error={fieldErrors.description?.[0]}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
            <Select
              name="categoryId"
              label="Kategorie"
              options={categoryOptions}
              placeholder="Kategorie wählen (optional)"
              defaultValue=""
              error={fieldErrors.categoryId?.[0]}
            />
            <Select
              name="region"
              label="Region"
              options={REGION_OPTIONS}
              placeholder="Region wählen (optional)"
              defaultValue=""
              error={fieldErrors.region?.[0]}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
            <Input
              name="budgetMin"
              label={isSponsor ? "Budget von (€)" : "Preisvorstellung von (€)"}
              inputMode="decimal"
              placeholder="z.B. 500"
              error={fieldErrors.budgetMin?.[0]}
            />
            <Input
              name="budgetMax"
              label={isSponsor ? "Budget bis (€)" : "Preisvorstellung bis (€)"}
              inputMode="decimal"
              placeholder="z.B. 5.000"
              error={fieldErrors.budgetMax?.[0]}
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
                error={fieldErrors.reachRequired?.[0]}
              />
            )}
            <Input
              name="expiresAt"
              label="Läuft ab am"
              type="date"
              hint="Optional — danach verschwindet das Listing aus dem Marktplatz."
              error={fieldErrors.expiresAt?.[0]}
            />
            <Select
              name="status"
              label="Sichtbarkeit"
              defaultValue="active"
              options={[
                { value: "active", label: "Sofort veröffentlichen" },
                { value: "draft", label: "Als Entwurf speichern" },
              ]}
              error={fieldErrors.status?.[0]}
            />
          </div>

          {message && (
            <p style={{ margin: 0, color: "var(--danger)", fontSize: "var(--fs-sm)", fontWeight: 600 }}>{message}</p>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="submit" variant="primary" loading={pending} disabled={pending}>
              Listing speichern
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
