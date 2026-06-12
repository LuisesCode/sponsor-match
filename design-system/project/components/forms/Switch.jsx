import React from 'react';

/** SponsorMatch — Switch toggle. */
export function Switch({ label, description, checked, defaultChecked, disabled = false, onChange, id, size = 'md', style, ...rest }) {
  const reactId = React.useId ? React.useId() : 'sm-' + Math.random().toString(36).slice(2);
  const swId = id || reactId;
  const [internal, setInternal] = React.useState(Boolean(defaultChecked));
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internal;
  const [focus, setFocus] = React.useState(false);

  const dims = size === 'sm' ? { w: 36, h: 20, k: 14 } : { w: 44, h: 24, k: 18 };

  const toggle = (e) => {
    if (disabled) return;
    if (!isControlled) setInternal(e.target.checked);
    onChange && onChange(e);
  };

  return (
    <label htmlFor={swId} style={{
      display: 'inline-flex', alignItems: description ? 'flex-start' : 'center', gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, ...style,
    }}>
      <span style={{ position: 'relative', display: 'inline-flex', flex: '0 0 auto', marginTop: description ? 1 : 0 }}>
        <input
          id={swId} type="checkbox" role="switch" checked={isControlled ? checked : undefined}
          defaultChecked={isControlled ? undefined : defaultChecked} disabled={disabled}
          onChange={toggle} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ position: 'absolute', opacity: 0, width: dims.w, height: dims.h, margin: 0, cursor: 'inherit' }}
          {...rest}
        />
        <span style={{
          width: dims.w, height: dims.h, borderRadius: 'var(--radius-pill)',
          background: on ? 'var(--accent)' : 'var(--surface-3)',
          boxShadow: focus ? 'var(--focus-ring)' : 'inset 0 1px 2px rgba(0,0,0,0.08)',
          transition: 'background var(--dur-med) var(--ease-out)', display: 'inline-flex', alignItems: 'center',
        }}>
          <span style={{
            width: dims.k, height: dims.k, borderRadius: '50%', background: '#fff',
            boxShadow: 'var(--shadow-sm)', transform: `translateX(${on ? dims.w - dims.k - 3 : 3}px)`,
            transition: 'transform var(--dur-med) var(--ease-out)',
          }} />
        </span>
      </span>
      {label && (
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text)' }}>{label}</span>
          {description && <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{description}</span>}
        </span>
      )}
    </label>
  );
}
