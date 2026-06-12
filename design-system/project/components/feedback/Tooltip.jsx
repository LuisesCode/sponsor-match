import React from 'react';

/** SponsorMatch — Tooltip: hover/focus label. */
export function Tooltip({ content, side = 'top', children, delay = 80, style }) {
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef(null);
  const show = () => { timer.current = setTimeout(() => setOpen(true), delay); };
  const hide = () => { clearTimeout(timer.current); setOpen(false); };

  const pos = {
    top:    { bottom: '100%', left: '50%', transform: 'translateX(-50%) translateY(-8px)' },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%) translateY(8px)' },
    left:   { right: '100%', top: '50%', transform: 'translateY(-50%) translateX(-8px)' },
    right:  { left: '100%', top: '50%', transform: 'translateY(-50%) translateX(8px)' },
  }[side];

  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      <span role="tooltip" style={{
        position: 'absolute', ...pos, zIndex: 50, pointerEvents: 'none',
        padding: '6px 10px', background: 'var(--navy-900)', color: '#fff',
        fontFamily: 'var(--font-body)', fontSize: 'var(--fs-xs)', fontWeight: 600,
        borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)', whiteSpace: 'nowrap',
        opacity: open ? 1 : 0, transition: 'opacity var(--dur-fast) var(--ease-out)', ...style,
      }}>{content}</span>
    </span>
  );
}
