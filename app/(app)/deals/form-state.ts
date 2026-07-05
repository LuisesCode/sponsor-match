/** Zustände der Deal-Formulare (useActionState ↔ Server Actions, M5). */

export type DealFormState =
  | { status: "idle" }
  | {
      status: "error";
      message?: string;
      fieldErrors?: Partial<Record<string, string[]>>;
    };

export const initialDealFormState: DealFormState = { status: "idle" };

/** Für Ein-Klick-Aktionen (Zustimmen, Ablehnen, Stornieren). */
export type DealActionState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export const initialDealActionState: DealActionState = { status: "idle" };
