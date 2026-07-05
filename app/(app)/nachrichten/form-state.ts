/** Zustand des Kontakt-Formulars (useActionState ↔ startConversation). */
export type StartConversationFormState =
  | { status: "idle" }
  | { status: "error"; message: string };

export const initialStartConversationFormState: StartConversationFormState = {
  status: "idle",
};
