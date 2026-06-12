"use client";

import * as React from "react";

/** SponsorMatch — Checkbox mit Label & Beschreibung. Controlled oder uncontrolled. */
export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  wrapStyle?: React.CSSProperties;
}

export function Checkbox({
  label,
  description,
  error,
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  id,
  style,
  wrapStyle,
  ...rest
}: CheckboxProps) {
  const reactId = React.useId();
  const cbId = id || reactId;
  const [internal, setInternal] = React.useState(Boolean(defaultChecked));
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internal;
  const [focus, setFocus] = React.useState(false);
  const invalid = Boolean(error);

  const toggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (!isControlled) setInternal(e.target.checked);
    onChange?.(e);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...wrapStyle }}>
      <label
        htmlFor={cbId}
        style={{
          display: "inline-flex",
          alignItems: description ? "flex-start" : "center",
          gap: 10,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          ...style,
        }}
      >
        <span
          style={{
            position: "relative",
            display: "inline-flex",
            flex: "0 0 auto",
            marginTop: description ? 2 : 0,
          }}
        >
          <input
            id={cbId}
            type="checkbox"
            checked={isControlled ? checked : undefined}
            defaultChecked={isControlled ? undefined : defaultChecked}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            onChange={toggle}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            style={{
              position: "absolute",
              opacity: 0,
              width: 20,
              height: 20,
              margin: 0,
              cursor: "inherit",
            }}
            {...rest}
          />
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: "var(--radius-sm)",
              border: `1.5px solid ${
                invalid
                  ? "var(--danger)"
                  : on
                    ? "var(--accent)"
                    : "var(--border-strong)"
              }`,
              background: on ? "var(--accent)" : "var(--surface)",
              boxShadow: focus ? "var(--focus-ring)" : "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transition:
                "background var(--dur-fast), border-color var(--dur-fast)",
            }}
          >
            {on && (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--on-accent)"
                strokeWidth="3.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </span>
        </span>
        {label && (
          <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-sm)",
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              {label}
            </span>
            {description && (
              <span
                style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}
              >
                {description}
              </span>
            )}
          </span>
        )}
      </label>
      {error && (
        <span style={{ fontSize: "var(--fs-xs)", color: "var(--danger)" }}>
          {error}
        </span>
      )}
    </div>
  );
}
