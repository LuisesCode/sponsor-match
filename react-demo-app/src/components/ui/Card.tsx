import * as React from "react";

/** Flenzko — Card: Surface-Container mit optionalem Hover-Lift & Akzent-Kante. */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
  accent?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Card({
  children,
  padding = "md",
  interactive = false,
  accent,
  header,
  footer,
  style,
  onClick,
  ...rest
}: CardProps) {
  const [hover, setHover] = React.useState(false);
  const pads: Record<string, string | number> = {
    none: 0,
    sm: "var(--space-4)",
    md: "var(--space-5)",
    lg: "var(--space-6)",
  };
  const pad = pads[padding] ?? pads.md;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        boxShadow: interactive && hover ? "var(--shadow-lg)" : "var(--shadow-sm)",
        borderTop: accent ? `3px solid ${accent}` : "1px solid var(--border)",
        transform: interactive && hover ? "translateY(-3px)" : "none",
        transition: "box-shadow var(--dur-med) var(--ease-out), transform var(--dur-med) var(--ease-out)",
        cursor: interactive ? "pointer" : "default",
        overflow: "hidden",
        ...style,
      }}
      {...rest}
    >
      {header && (
        <div style={{ padding: `${pad === 0 ? "var(--space-5)" : pad} ${pad === 0 ? "var(--space-5)" : pad} 0` }}>
          {header}
        </div>
      )}
      <div style={{ padding: pad, flex: 1 }}>{children}</div>
      {footer && (
        <div style={{ padding: pad, paddingTop: 0, borderTop: "1px solid var(--border)", background: "var(--surface-inset)" }}>
          {footer}
        </div>
      )}
    </div>
  );
}
