import * as React from "react";

/** Flenzko — Badge: kompakte Status-/Kategorie-Pille. */
export type BadgeTone =
  | "neutral"
  | "primary"
  | "accent"
  | "energy"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "solid";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: "sm" | "md";
  dot?: boolean;
  icon?: React.ReactNode;
}

const TONES: Record<BadgeTone, [string, string]> = {
  neutral: ["var(--surface-3)", "var(--text)"],
  primary: ["var(--primary-soft)", "var(--primary)"],
  accent: ["var(--accent-soft)", "var(--accent-press)"],
  energy: ["var(--energy-soft)", "var(--energy-press)"],
  success: ["var(--success-soft)", "var(--success)"],
  warning: ["var(--warning-soft)", "color-mix(in srgb, var(--warning) 75%, #000)"],
  danger: ["var(--danger-soft)", "var(--danger)"],
  info: ["var(--info-soft)", "var(--info)"],
  solid: ["var(--primary)", "var(--on-primary)"],
};

export function Badge({ children, tone = "neutral", size = "md", dot = false, icon, style, ...rest }: BadgeProps) {
  const [bg, fg] = TONES[tone] ?? TONES.neutral;
  const pad = size === "sm" ? "2px 8px" : "4px 11px";
  const fs = size === "sm" ? "var(--fs-2xs)" : "var(--fs-xs)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: pad,
        background: bg,
        color: fg,
        borderRadius: "var(--radius-pill)",
        fontFamily: "var(--font-body)",
        fontSize: fs,
        fontWeight: 700,
        lineHeight: 1.3,
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />}
      {icon && <span style={{ display: "inline-flex" }}>{icon}</span>}
      {children}
    </span>
  );
}
