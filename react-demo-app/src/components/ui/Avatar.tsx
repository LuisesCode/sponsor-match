import * as React from "react";

/** Flenzko — Avatar: Bild oder Initialen, optional Verifiziert-Ring & Status. */
export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  verified?: boolean;
  status?: "online" | "busy" | "offline";
  shape?: "circle" | "square";
}

const SIZES = { xs: 24, sm: 32, md: 44, lg: 56, xl: 80 } as const;

export function Avatar({
  src,
  name = "",
  size = "md",
  verified = false,
  status,
  shape = "circle",
  style,
  ...rest
}: AvatarProps) {
  const dim = typeof size === "number" ? size : (SIZES[size] ?? SIZES.md);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const radius = shape === "square" ? "var(--radius-md)" : "50%";

  return (
    <span style={{ position: "relative", display: "inline-flex", flex: "0 0 auto", ...style }} {...rest}>
      <span
        style={{
          width: dim,
          height: dim,
          borderRadius: radius,
          overflow: "hidden",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: src ? "var(--surface-2)" : "var(--navy-100)",
          color: "var(--navy-600)",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: dim * 0.38,
          letterSpacing: "-0.02em",
          border: verified ? "2px solid var(--verified)" : "1px solid var(--border)",
          boxShadow: verified ? "0 0 0 2px var(--surface)" : "none",
        }}
      >
        {src ? (
          // Externe/Nutzer-Avatare: bewusst <img>, Quelle ist dynamisch (Supabase Storage später)
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          initials
        )}
      </span>
      {verified && (
        <span
          style={{
            position: "absolute",
            right: -2,
            bottom: -2,
            width: dim * 0.34,
            height: dim * 0.34,
            minWidth: 14,
            minHeight: 14,
            maxWidth: 22,
            maxHeight: 22,
            borderRadius: "50%",
            background: "var(--verified)",
            border: "2px solid var(--surface)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
          }}
        >
          <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
      {status && !verified && (
        <span
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: dim * 0.28,
            height: dim * 0.28,
            minWidth: 10,
            minHeight: 10,
            borderRadius: "50%",
            border: "2px solid var(--surface)",
            background:
              status === "online" ? "var(--success)" : status === "busy" ? "var(--warning)" : "var(--gray-400)",
          }}
        />
      )}
    </span>
  );
}
