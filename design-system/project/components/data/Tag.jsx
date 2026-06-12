import React from 'react';

/** SponsorMatch — Tag: category chip, optionally selectable or removable. */
export function Tag({ children, selected = false, onRemove, onClick, icon, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const clickable = Boolean(onClick);
  return (
    <span
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px',
        background: selected ? 'var(--primary)' : (hover && clickable ? 'var(--surface-3)' : 'var(--surface-2)'),
        color: selected ? 'var(--on-primary)' : 'var(--text)',
        border: `1px solid ${selected ? 'transparent' : 'var(--border)'}`,
        borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-body)',
        fontSize: 'var(--fs-sm)', fontWeight: 600, whiteSpace: 'nowrap',
        cursor: clickable ? 'pointer' : 'default', userSelect: 'none',
        transition: 'background var(--dur-fast), color var(--dur-fast)', ...style,
      }}
      {...rest}
    >
      {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
      {children}
      {onRemove && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} aria-label="Entfernen" style={{
          border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex',
          color: 'currentColor', opacity: 0.6, padding: 0, marginLeft: 1,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      )}
    </span>
  );
}
