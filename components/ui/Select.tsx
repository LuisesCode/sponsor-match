"use client";

import * as React from "react";

/** SponsorMatch — Select: natives Select im Input-Stil mit eigenem Chevron. */
export type SelectSize = "sm" | "md" | "lg";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** Optionen als Strings oder {value,label}; alternativ <option>-Children. */
  options?: (string | SelectOption)[];
  placeholder?: string;
  size?: SelectSize;
  wrapStyle?: React.CSSProperties;
}

const HEIGHTS: Record<SelectSize, string> = {
  sm: "var(--control-sm)",
  md: "var(--control-md)",
  lg: "var(--control-lg)",
};

const FONTS: Record<SelectSize, string> = {
  sm: "var(--fs-sm)",
  md: "var(--fs-base)",
  lg: "var(--fs-lg)",
};

export function Select({
  label,
  hint,
  error,
  options = [],
  placeholder,
  size = "md",
  id,
  required = false,
  disabled = false,
  value,
  defaultValue,
  onChange,
  style,
  wrapStyle,
  children,
  ...rest
}: SelectProps) {
  const [focus, setFocus] = React.useState(false);
  const reactId = React.useId();
  const selId = id ?? reactId;
  const invalid = Boolean(error);
  const borderColor = invalid ? "var(--danger)" : focus ? "var(--primary)" : "var(--border-strong)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", ...wrapStyle }}>
      {label && (
        <label
          htmlFor={selId}
          style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text)" }}
        >
          {label}
          {required && <span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>}
        </label>
      )}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          height: HEIGHTS[size],
          background: disabled ? "var(--surface-2)" : "var(--surface)",
          border: `1.5px solid ${borderColor}`,
          borderRadius: "var(--radius-md)",
          boxShadow: focus ? "var(--focus-ring)" : "var(--shadow-xs)",
          transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <select
          id={selId}
          disabled={disabled}
          required={required}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          aria-invalid={invalid || undefined}
          style={{
            appearance: "none",
            WebkitAppearance: "none",
            width: "100%",
            height: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            cursor: "pointer",
            padding: "0 var(--space-8) 0 var(--space-3)",
            fontFamily: "var(--font-body)",
            fontSize: FONTS[size],
            color: "var(--text)",
            ...style,
          }}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children ??
            options.map((o) => {
              const opt = typeof o === "string" ? { value: o, label: o } : o;
              return (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              );
            })}
        </select>
        <span
          style={{
            position: "absolute",
            right: "var(--space-3)",
            pointerEvents: "none",
            color: "var(--text-muted)",
            display: "inline-flex",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </div>
      {(error || hint) && (
        <span style={{ fontSize: "var(--fs-xs)", color: invalid ? "var(--danger)" : "var(--text-muted)" }}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
