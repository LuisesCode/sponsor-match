/** Gemeinsamer Zustand der Auth-Formulare (useActionState ↔ Server Actions). */
export type AuthFormState =
  | { status: "idle" }
  | {
      status: "error";
      message?: string;
      fieldErrors?: Partial<Record<string, string[]>>;
    }
  | { status: "success"; email: string };

export const initialAuthFormState: AuthFormState = { status: "idle" };
