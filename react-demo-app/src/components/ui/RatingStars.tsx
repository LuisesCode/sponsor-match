import * as React from "react";

/** Flenzko — RatingStars: Bewertungssterne (Anzeige oder Eingabe). Wert deutsch formatiert (4,9). */
export interface RatingStarsProps extends React.HTMLAttributes<HTMLSpanElement> {
  value?: number;
  max?: number;
  count?: number;
  size?: number;
  showValue?: boolean;
  interactive?: boolean;
  onValueChange?: (value: number) => void;
}

function Star({ fill, size }: { fill: number; size: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
      <defs>
        <linearGradient id={id}>
          <stop offset={`${fill * 100}%`} stopColor="var(--rating-star)" />
          <stop offset={`${fill * 100}%`} stopColor="var(--surface-3)" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.2l2.9 6 6.6.9-4.8 4.6 1.2 6.6L12 17.7 6.1 20.9l1.2-6.6L2.5 9.7l6.6-.9z"
        fill={`url(#${id})`}
        stroke="var(--rating-star)"
        strokeWidth="0.8"
        strokeOpacity={fill > 0 ? 0.5 : 0.25}
      />
    </svg>
  );
}

export function RatingStars({
  value = 0,
  max = 5,
  count,
  size = 18,
  showValue = false,
  interactive = false,
  onValueChange,
  style,
  ...rest
}: RatingStarsProps) {
  const [hover, setHover] = React.useState<number | null>(null);
  const display = hover !== null ? hover : value;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, ...style }} {...rest}>
      <span
        style={{ display: "inline-flex", gap: 2, cursor: interactive ? "pointer" : "default" }}
        onMouseLeave={() => interactive && setHover(null)}
      >
        {Array.from({ length: max }).map((_, i) => {
          const fill = Math.max(0, Math.min(1, display - i));
          return (
            <span
              key={i}
              onMouseEnter={() => interactive && setHover(i + 1)}
              onClick={() => interactive && onValueChange?.(i + 1)}
            >
              <Star fill={fill} size={size} />
            </span>
          );
        })}
      </span>
      {showValue && (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: size * 0.8, color: "var(--text)" }}>
          {value.toFixed(1).replace(".", ",")}
        </span>
      )}
      {count != null && (
        <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
          ({count})
        </span>
      )}
    </span>
  );
}
