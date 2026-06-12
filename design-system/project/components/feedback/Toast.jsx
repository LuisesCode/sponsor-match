import React from 'react';

/** SponsorMatch — Toast: notification card (presentational). */
const TONES = {
  neutral: { accent: 'var(--primary)', icon: 'info' },
  success: { accent: 'var(--success)', icon: 'check' },
  warning: { accent: 'var(--warning)', icon: 'alert' },
  danger:  { accent: 'var(--danger)', icon: 'alert' },
  info:    { accent: 'var(--info)', icon: 'info' },
};

function ToastIcon({ kind, color }) {
  const c = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (kind === 'check') return <svg {...c}><polyline points="20 6 9 17 4 12"/></svg>;
  if (kind === 'alert') return <svg {...c}><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>;
  return <svg {...c}><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/></svg>;
}

export function Toast({ title, description, tone = 'neutral', onClose, action, icon, style, ...rest }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <div role="status" style={{
      display: 'flex', alignItems: 'flex-start', gap: 12, width: 360, maxWidth: '92vw',
      padding: '14px 14px 14px 16px', background: 'var(--surface)',
      border: '1px solid var(--border)', borderLeft: `4px solid ${t.accent}`,
      borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', ...style,
    }} {...rest}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto',
        width: 32, height: 32, borderRadius: 'var(--radius-md)',
        background: `color-mix(in srgb, ${t.accent} 14%, transparent)`,
      }}>{icon || <ToastIcon kind={t.icon} color={t.accent} />}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--fs-sm)', color: 'var(--text)', letterSpacing: '-0.01em' }}>{title}</div>}
        {description && <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>}
        {action && <div style={{ marginTop: 8 }}>{action}</div>}
      </div>
      {onClose && (
        <button onClick={onClose} aria-label="Schließen" style={{
          flex: '0 0 auto', border: 'none', background: 'transparent', cursor: 'pointer',
          color: 'var(--text-subtle)', padding: 2, display: 'inline-flex', borderRadius: 6,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      )}
    </div>
  );
}
