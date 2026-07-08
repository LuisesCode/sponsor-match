import type { ReactNode } from "react";

/** Fehlerbanner im Stil des Design Systems (danger-soft Fläche). */
export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      style={{
        background: "var(--danger-soft)",
        color: "var(--text)",
        border: "1px solid color-mix(in srgb, var(--danger) 35%, transparent)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-3) var(--space-4)",
        fontSize: "var(--fs-sm)",
      }}
    >
      {children}
    </div>
  );
}
