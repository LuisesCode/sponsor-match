import React from 'react';

/** SponsorMatch — RadioGroup + Radio. */
export function RadioGroup({ name, value, defaultValue, onChange, children, style }) {
  const reactName = React.useId ? React.useId() : 'sm-' + Math.random().toString(36).slice(2);
  const groupName = name || reactName;
  return (
    <div role="radiogroup" style={{ display: 'flex', flexDirection: 'column', gap: 10, ...style }}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, {
              name: groupName,
              checked: value !== undefined ? child.props.value === value : undefined,
              defaultChecked: defaultValue !== undefined ? child.props.value === defaultValue : child.props.defaultChecked,
              onChange,
            })
          : child
      )}
    </div>
  );
}

export function Radio({ label, description, value, name, checked, defaultChecked, disabled = false, onChange, id, style, ...rest }) {
  const reactId = React.useId ? React.useId() : 'sm-' + Math.random().toString(36).slice(2);
  const rId = id || reactId;
  const [focus, setFocus] = React.useState(false);
  return (
    <label htmlFor={rId} style={{
      display: 'inline-flex', alignItems: description ? 'flex-start' : 'center', gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, ...style,
    }}>
      <span style={{ position: 'relative', display: 'inline-flex', flex: '0 0 auto', marginTop: description ? 2 : 0 }}>
        <input
          id={rId} type="radio" name={name} value={value} checked={checked}
          defaultChecked={defaultChecked} disabled={disabled} onChange={onChange}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ position: 'absolute', opacity: 0, width: 20, height: 20, margin: 0, cursor: 'inherit' }}
          {...rest}
        />
        <span style={{
          width: 20, height: 20, borderRadius: '50%',
          border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--border-strong)'}`,
          background: 'var(--surface)', boxShadow: focus ? 'var(--focus-ring)' : 'none',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color var(--dur-fast)',
        }}>
          {checked && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} />}
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
