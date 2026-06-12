import React from 'react';

/** SponsorMatch — RatingStars: display or input star rating. */
function Star({ fill, size }) {
  const id = React.useId ? React.useId() : 's' + Math.random().toString(36).slice(2);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={id}>
          <stop offset={`${fill * 100}%`} stopColor="var(--rating-star)" />
          <stop offset={`${fill * 100}%`} stopColor="var(--surface-3)" />
        </linearGradient>
      </defs>
      <path d="M12 2.2l2.9 6 6.6.9-4.8 4.6 1.2 6.6L12 17.7 6.1 20.9l1.2-6.6L2.5 9.7l6.6-.9z"
        fill={`url(#${id})`} stroke="var(--rating-star)" strokeWidth="0.8" strokeOpacity={fill > 0 ? 0.5 : 0.25} />
    </svg>
  );
}

export function RatingStars({ value = 0, max = 5, count, size = 18, showValue = false, interactive = false, onChange, style, ...rest }) {
  const [hover, setHover] = React.useState(null);
  const display = hover !== null ? hover : value;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, ...style }} {...rest}>
      <span style={{ display: 'inline-flex', gap: 2, cursor: interactive ? 'pointer' : 'default' }}
        onMouseLeave={() => interactive && setHover(null)}>
        {Array.from({ length: max }).map((_, i) => {
          const fill = Math.max(0, Math.min(1, display - i));
          return (
            <span key={i}
              onMouseEnter={() => interactive && setHover(i + 1)}
              onClick={() => interactive && onChange && onChange(i + 1)}>
              <Star fill={fill} size={size} />
            </span>
          );
        })}
      </span>
      {showValue && (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: size * 0.8, color: 'var(--text)' }}>
          {value.toFixed(1).replace('.', ',')}
        </span>
      )}
      {count != null && (
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
          ({count})
        </span>
      )}
    </span>
  );
}
