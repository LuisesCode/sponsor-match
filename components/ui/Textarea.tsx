"use client";

import * as React from "react";

/**
 * SponsorMatch — Textarea: mehrzeiliges Textfeld im Input-Stil.
 * (Ergänzung zum Design-System-Handoff, der nur einzeilige Inputs enthielt —
 * Optik und Zustände folgen exakt der Input-Komponente.)
 */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  wrapStyle?: React.CSSProperties;
}

export function Textarea({
  label,
  hint,
  error,
  id,
  required = false,
  disabled = false,
  rows = 4,
  style,
  wrapStyle,
  ...rest
}: TextareaProps) {
  const [focus, setFocus] = React.useState(false);
  const reactId = React.useId();
  const areaId = id ?? reactId;
  const invalid = Boolean(error);
  const borderColor = invalid ? "var(--danger)" : focus ? "var(--primary)" : "var(--border-strong)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", ...wrapStyle }}>
      {label && (
        <label
          htmlFor={areaId}
          style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text)" }}
        >
          {label}
          {required && <span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>}
        </label>
      )}
      <textarea
        id={areaId}
        rows={rows}
        disabled={disabled}
        required={required}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        aria-invalid={invalid || undefined}
        style={{
          width: "100%",
          resize: "vertical",
          padding: "var(--space-3)",
          background: disabled ? "var(--surface-2)" : "var(--surface)",
          border: `1.5px solid ${borderColor}`,
          borderRadius: "var(--radius-md)",
          boxShadow: focus ? "var(--focus-ring)" : "var(--shadow-xs)",
          transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)",
          opacity: disabled ? 0.6 : 1,
          outline: "none",
          fontFamily: "var(--font-body)",
          fontSize: "var(--fs-base)",
          lineHeight: "var(--lh-normal)",
          color: "var(--text)",
          ...style,
        }}
        {...rest}
      />
      {(error || hint) && (
        <span style={{ fontSize: "var(--fs-xs)", color: invalid ? "var(--danger)" : "var(--text-muted)" }}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
