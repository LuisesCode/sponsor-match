import React from 'react';
import { Icon } from './Icon.jsx';

/** SponsorMatch — IconButton: square icon-only button. */
const SIZES = { sm: 32, md: 40, lg: 48 };
const ICON = { sm: 16, md: 18, lg: 22 };

export function IconButton({
  icon, name, variant = 'ghost', size = 'md', label, disabled = false,
  onClick, style, ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const dim = SIZES[size] || SIZES.md;

  const tones = {
    ghost: { bg: 'transparent', bgHover: 'var(--surface-2)', fg: 'var(--text-muted)', fgHover: 'var(--text)', border: 'transparent' },
    outline: { bg: 'var(--surface)', bgHover: 'var(--surface-2)', fg: 'var(--text)', fgHover: 'var(--text)', border: 'var(--border)' },
    solid: { bg: 'var(--primary)', bgHover: 'var(--primary-hover)', fg: 'var(--on-primary)', fgHover: 'var(--on-primary)', border: 'transparent' },
    accent: { bg: 'var(--accent)', bgHover: 'var(--accent-hover)', fg: 'var(--on-accent)', fgHover: 'var(--on-accent)', border: 'transparent' },
  }[variant] || {};

  return (
    <button
      type="button" aria-label={label} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      onClick={disabled ? undefined : onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: dim, height: dim, borderRadius: 'var(--radius-md)',
        background: hover ? tones.bgHover : tones.bg,
        color: hover ? tones.fgHover : tones.fg,
        border: `1.5px solid ${tones.border}`,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        boxShadow: focus ? 'var(--focus-ring)' : 'none',
        transform: press ? 'scale(0.94)' : 'none', outline: 'none',
        transition: 'background var(--dur-fast) var(--ease-out), color var(--dur-fast), transform var(--dur-fast)',
        ...style,
      }}
      {...rest}
    >
      {icon || <Icon name={name} size={ICON[size]} />}
    </button>
  );
}
