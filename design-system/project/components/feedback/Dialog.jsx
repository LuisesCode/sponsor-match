import React from 'react';

/** SponsorMatch — Dialog: modal overlay. */
export function Dialog({ open = true, title, description, children, footer, onClose, width = 480, style }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-4)', background: 'var(--overlay)', backdropFilter: 'blur(3px)',
        animation: 'sm-fade var(--dur-med) var(--ease-out)',
      }}>
      <style>{'@keyframes sm-fade{from{opacity:0}to{opacity:1}}@keyframes sm-pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}'}</style>
      <div style={{
        width, maxWidth: '100%', background: 'var(--surface)', borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)', overflow: 'hidden',
        animation: 'sm-pop var(--dur-med) var(--ease-out)', ...style,
      }} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ padding: 'var(--space-6) var(--space-6) 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              {title && <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--fs-h3)', color: 'var(--text)', margin: 0 }}>{title}</h3>}
              {description && <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', margin: '6px 0 0' }}>{description}</p>}
            </div>
            {onClose && (
              <button onClick={onClose} aria-label="Schließen" style={{
                border: 'none', background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text-muted)',
                width: 32, height: 32, borderRadius: 'var(--radius-md)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
        </div>
        {children && <div style={{ padding: 'var(--space-5) var(--space-6)', fontSize: 'var(--fs-base)', color: 'var(--text)' }}>{children}</div>}
        {footer && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--border)', background: 'var(--surface-inset)' }}>{footer}</div>
        )}
      </div>
    </div>
  );
}
