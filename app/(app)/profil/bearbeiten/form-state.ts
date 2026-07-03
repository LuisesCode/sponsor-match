/** Zustand des Profil-bearbeiten-Formulars (useActionState ↔ Server Action). */
export type ProfileEditFormState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      message?: string;
      fieldErrors?: Partial<Record<string, string[]>>;
    };

export const initialProfileEditFormState: ProfileEditFormState = { status: "idle" };
