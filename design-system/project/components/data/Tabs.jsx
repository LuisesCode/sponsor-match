import React from 'react';

/** SponsorMatch — Tabs: underline tab bar. */
export function Tabs({ tabs = [], value, defaultValue, onChange, variant = 'underline', style }) {
  const [internal, setInternal] = React.useState(defaultValue ?? (tabs[0] && (tabs[0].value ?? tabs[0])));
  const active = value !== undefined ? value : internal;
  const select = (v) => { if (value === undefined) setInternal(v); onChange && onChange(v); };

  const isPill = variant === 'pill';
  return (
    <div role="tablist" style={{
      display: 'inline-flex', gap: isPill ? 4 : 4, alignItems: 'center',
      borderBottom: isPill ? 'none' : '1.5px solid var(--border)',
      background: isPill ? 'var(--surface-2)' : 'transparent',
      padding: isPill ? 4 : 0, borderRadius: isPill ? 'var(--radius-lg)' : 0, ...style,
    }}>
      {tabs.map((t) => {
        const tab = typeof t === 'string' ? { value: t, label: t } : t;
        const on = tab.value === active;
        return (
          <button key={tab.value} role="tab" aria-selected={on} onClick={() => select(tab.value)}
            style={{
              position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 7,
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 'var(--fs-sm)', letterSpacing: '-0.01em',
              padding: isPill ? '7px 14px' : '10px 4px', marginBottom: isPill ? 0 : '-1.5px',
              borderRadius: isPill ? 'var(--radius-md)' : 0,
              color: on ? (isPill ? 'var(--text)' : 'var(--primary)') : 'var(--text-muted)',
              background: isPill && on ? 'var(--surface)' : 'transparent',
              boxShadow: isPill && on ? 'var(--shadow-sm)' : 'none',
              borderBottom: isPill ? 'none' : `2.5px solid ${on ? 'var(--primary)' : 'transparent'}`,
              transition: 'color var(--dur-fast), background var(--dur-fast)',
            }}>
            {tab.icon && <span style={{ display: 'inline-flex' }}>{tab.icon}</span>}
            {tab.label}
            {tab.count != null && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-2xs)', fontWeight: 700,
                padding: '1px 6px', borderRadius: 'var(--radius-pill)',
                background: on ? 'var(--primary-soft)' : 'var(--surface-3)', color: on ? 'var(--primary)' : 'var(--text-muted)',
              }}>{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
