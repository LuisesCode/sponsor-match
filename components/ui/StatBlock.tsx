"use client";

import * as React from "react";

/** SponsorMatch — StatBlock: Kennzahl mit Label und optionalem Delta. Zahlen in Mono. */
export interface StatBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  value: React.ReactNode;
  label: string;
  delta?: string;
  deltaDirection?: "up" | "down";
  icon?: React.ReactNode;
  align?: "left" | "center";
}

export function StatBlock({
  value,
  label,
  delta,
  deltaDirection,
  icon,
  align = "left",
  style,
  ...rest
}: StatBlockProps) {
  const up = deltaDirection === "up" || (deltaDirection === undefined && delta?.trim().startsWith("+"));
  const down = deltaDirection === "down" || (deltaDirection === undefined && delta?.trim().startsWith("-"));
  const deltaColor = up ? "var(--success)" : down ? "var(--danger)" : "var(--text-muted)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        alignItems: align === "center" ? "center" : "flex-start",
        ...style,
      }}
      {...rest}
    >
      {icon && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 4,
            width: 34,
            height: 34,
            borderRadius: "var(--radius-md)",
            background: "var(--accent-soft)",
            color: "var(--accent-press)",
          }}
        >
          {icon}
        </span>
      )}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontWeight: 700,
          fontSize: "var(--fs-h2)",
          color: "var(--text)",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)", color: "var(--text-muted)", fontWeight: 600 }}>
          {label}
        </span>
        {delta != null && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 2,
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-xs)",
              fontWeight: 700,
              color: deltaColor,
            }}
          >
            {up && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 15 12 9 18 15" />
              </svg>
            )}
            {down && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
            {delta}
          </span>
        )}
      </span>
    </div>
  );
}
