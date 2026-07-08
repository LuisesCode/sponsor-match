/**
 * Flenzko — Wortmarke als Inline-SVG (kein Asset-Pfad nötig, funktioniert
 * unabhängig vom Vite-`base`-Pfad auf GitHub Pages). Mark identisch zum
 * SponsorMatch-Original (design-system/project/assets/logo-mark.svg) —
 * symbolisiert "Match" markenneutral, nur der Wortmarken-Text ist neu.
 */
export function Logo({
  tone = "navy",
  height = 30,
  className,
}: {
  /** "navy" für helle Hintergründe, "white" für dunkle (z.B. Footer). */
  tone?: "navy" | "white";
  height?: number;
  className?: string;
}) {
  const textColor = tone === "white" ? "#FFFFFF" : "#0C1A33";
  return (
    <svg
      width={height * 5}
      height={height}
      viewBox="0 0 150 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Flenzko"
      className={className}
    >
      <rect width="30" height="30" rx="7.5" fill="#1B3A6B" />
      <path d="M6.9 10.3 L13.4 15 L6.9 19.7 Z" fill="#FFFFFF" />
      <path d="M23.1 10.3 L16.6 15 L23.1 19.7 Z" fill="#16B486" />
      <circle cx="15" cy="15" r="1.5" fill="#FF6B35" />
      <text
        x="38"
        y="20.5"
        fontFamily="Archivo, system-ui, sans-serif"
        fontWeight={800}
        fontSize="16"
        letterSpacing="-0.3"
        fill={textColor}
      >
        Flen<tspan fill="#16B486">zko</tspan>
      </text>
    </svg>
  );
}
