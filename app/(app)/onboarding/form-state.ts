/** Zustand des Onboarding-Formulars (useActionState ↔ Server Action). */
export type OnboardingFormState =
  | { status: "idle" }
  | {
      status: "error";
      message?: string;
      fieldErrors?: Partial<Record<string, string[]>>;
    };

export const initialOnboardingFormState: OnboardingFormState = { status: "idle" };
