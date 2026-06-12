"use client";

import * as React from "react";
import { icons, type LucideProps } from "lucide-react";

/**
 * SponsorMatch — Icon (Lucide-Wrapper)
 * Nimmt kebab-case-Namen wie im Design System ("shield-check") entgegen
 * und rendert das entsprechende lucide-react-Icon (Outline, Strichstärke 2).
 */
export interface IconProps extends Omit<LucideProps, "name" | "ref"> {
  /** Lucide-Icon-Name in kebab-case, z.B. "shield-check", "search" */
  name: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

function toPascalCase(kebab: string): string {
  return kebab
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  color = "currentColor",
  style,
  ...rest
}: IconProps) {
  const LucideIcon = icons[toPascalCase(name) as keyof typeof icons];
  if (!LucideIcon) return null;
  return (
    <span
      aria-hidden="true"
      style={{ display: "inline-flex", width: size, height: size, color, flex: "0 0 auto", ...style }}
    >
      <LucideIcon size={size} strokeWidth={strokeWidth} {...rest} />
    </span>
  );
}
