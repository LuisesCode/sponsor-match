import React from 'react';

/**
 * SponsorMatch — VerifiedBadge: trust signal.
 * type: "verified" (Identität geprüft), "pro" (Premium), "secure" (sichere Zahlung).
 */
const CONFIG = {
  verified: { bg: 'var(--verified)', fg: '#fff', label: 'Verifiziert', path: 'check' },
  pro:      { bg: 'var(--primary)', fg: 'var(--on-primary)', label: 'Pro', path: 'star' },
  secure:   { bg: 'var(--secure)', fg: '#fff', label: 'Sichere Zahlung', path: 'lock' },
};

function Glyph({ kind }) {
  const common = { width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (kind === 'lock') return <svg {...common}><rect x="4" y="11" width="16" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>;
  if (kind === 'star') return <svg {...common} fill="currentColor" stroke="none"><path d="M12 2.5l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.9 6.7 19l1.1-6L3.4 8.8l6-.8z"/></svg>;
  return <svg {...common}><polyline points="20 6 9 17 4 12"></polyline></svg>;
}

export function VerifiedBadge({ type = 'verified', showLabel = true, size = 'md', style, ...rest }) {
  const c = CONFIG[type] || CONFIG.verified;
  const dim = size === 'sm' ? 16 : 20;

  if (!showLabel) {
    return (
      <span title={c.label} style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: dim, height: dim, borderRadius: '50%', background: c.bg, color: c.fg, ...style,
      }} {...rest}>
        <Glyph kind={c.path} />
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: size === 'sm' ? '2px 8px 2px 6px' : '3px 11px 3px 8px',
      background: 'color-mix(in srgb, ' + c.bg + ' 14%, transparent)',
      color: c.bg === 'var(--primary)' ? 'var(--primary)' : c.bg,
      borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-body)',
      fontSize: size === 'sm' ? 'var(--fs-2xs)' : 'var(--fs-xs)', fontWeight: 700, whiteSpace: 'nowrap', ...style,
    }} {...rest}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size === 'sm' ? 13 : 16, height: size === 'sm' ? 13 : 16,
        borderRadius: '50%', background: c.bg, color: c.fg,
      }}><Glyph kind={c.path} /></span>
      {c.label}
    </span>
  );
}
