"use client";

import * as React from "react";

/** SponsorMatch — Input: Textfeld mit optionalem Label, Hinweis, Fehler und Icons. */
export type InputSize = "sm" | "md" | "lg";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  size?: InputSize;
  wrapStyle?: React.CSSProperties;
}

const HEIGHTS: Record<InputSize, string> = {
  sm: "var(--control-sm)",
  md: "var(--control-md)",
  lg: "var(--control-lg)",
};

const FONTS: Record<InputSize, string> = {
  sm: "var(--fs-sm)",
  md: "var(--fs-base)",
  lg: "var(--fs-lg)",
};

export function Input({
  label,
  hint,
  error,
  iconLeft,
  iconRight,
  size = "md",
  id,
  required = false,
  disabled = false,
  style,
  wrapStyle,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [focus, setFocus] = React.useState(false);
  const reactId = React.useId();
  const inputId = id || reactId;
  const invalid = Boolean(error);
  const describedBy = error || hint ? `${inputId}-desc` : undefined;

  const borderColor = invalid
    ? "var(--danger)"
    : focus
      ? "var(--primary)"
      : "var(--border-strong)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        width: "100%",
        ...wrapStyle,
      }}
    >
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            fontWeight: 600,
            color: "var(--text)",
          }}
        >
          {label}
          {required && (
            <span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>
          )}
        </label>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: HEIGHTS[size],
          padding: "0 var(--space-3)",
          background: disabled ? "var(--surface-2)" : "var(--surface)",
          border: `1.5px solid ${borderColor}`,
          borderRadius: "var(--radius-md)",
          boxShadow: focus ? "var(--focus-ring)" : "var(--shadow-xs)",
          transition:
            "border-color var(--dur-fast), box-shadow var(--dur-fast)",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {iconLeft && (
          <span
            style={{
              display: "inline-flex",
              color: "var(--text-subtle)",
              flex: "0 0 auto",
            }}
          >
            {iconLeft}
          </span>
        )}
        <input
          id={inputId}
          disabled={disabled}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onFocus={(e) => {
            setFocus(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            onBlur?.(e);
          }}
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "var(--font-body)",
            fontSize: FONTS[size],
            color: "var(--text)",
            height: "100%",
            ...style,
          }}
          {...rest}
        />
        {iconRight && (
          <span
            style={{
              display: "inline-flex",
              color: "var(--text-subtle)",
              flex: "0 0 auto",
            }}
          >
            {iconRight}
          </span>
        )}
      </div>
      {(error || hint) && (
        <span
          id={describedBy}
          style={{
            fontSize: "var(--fs-xs)",
            color: invalid ? "var(--danger)" : "var(--text-muted)",
          }}
        >
          {error || hint}
        </span>
      )}
    </div>
  );
}
