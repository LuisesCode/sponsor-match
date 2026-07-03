/** Zustand des Listing-Formulars (useActionState ↔ Server Action). */
export type ListingFormState =
  | { status: "idle" }
  | {
      status: "error";
      message?: string;
      fieldErrors?: Partial<Record<string, string[]>>;
    };

export const initialListingFormState: ListingFormState = { status: "idle" };
