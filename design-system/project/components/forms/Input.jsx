import React from 'react';

/** SponsorMatch — Input: text field with optional label, hint, error, icons. */
export function Input({
  label, hint, error, iconLeft, iconRight, size = 'md', id,
  required = false, disabled = false, style, wrapStyle, ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const reactId = React.useId ? React.useId() : 'sm-' + Math.random().toString(36).slice(2);
  const inputId = id || reactId;
  const heights = { sm: 'var(--control-sm)', md: 'var(--control-md)', lg: 'var(--control-lg)' };
  const fonts = { sm: 'var(--fs-sm)', md: 'var(--fs-base)', lg: 'var(--fs-lg)' };
  const invalid = Boolean(error);

  const borderColor = invalid ? 'var(--danger)' : focus ? 'var(--primary)' : 'var(--border-strong)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', ...wrapStyle }}>
      {label && (
        <label htmlFor={inputId} style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text)' }}>
          {label}{required && <span style={{ color: 'var(--danger)', marginLeft: 3 }}>*</span>}
        </label>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, height: heights[size],
        padding: '0 var(--space-3)', background: disabled ? 'var(--surface-2)' : 'var(--surface)',
        border: `1.5px solid ${borderColor}`, borderRadius: 'var(--radius-md)',
        boxShadow: focus ? 'var(--focus-ring)' : 'var(--shadow-xs)',
        transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
        opacity: disabled ? 0.6 : 1,
      }}>
        {iconLeft && <span style={{ display: 'inline-flex', color: 'var(--text-subtle)', flex: '0 0 auto' }}>{iconLeft}</span>}
        <input
          id={inputId} disabled={disabled} required={required}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'var(--font-body)', fontSize: fonts[size], color: 'var(--text)',
            height: '100%', ...style,
          }}
          {...rest}
        />
        {iconRight && <span style={{ display: 'inline-flex', color: 'var(--text-subtle)', flex: '0 0 auto' }}>{iconRight}</span>}
      </div>
      {(error || hint) && (
        <span style={{ fontSize: 'var(--fs-xs)', color: invalid ? 'var(--danger)' : 'var(--text-muted)' }}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
