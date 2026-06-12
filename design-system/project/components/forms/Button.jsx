import React from 'react';

/**
 * SponsorMatch — Button
 * Self-contained: only depends on CSS custom properties from styles.css.
 */
const SIZES = {
  sm: { height: 'var(--control-sm)', padding: '0 var(--space-3)', font: 'var(--fs-sm)', radius: 'var(--radius-md)', gap: '6px', icon: 16 },
  md: { height: 'var(--control-md)', padding: '0 var(--space-5)', font: 'var(--fs-base)', radius: 'var(--radius-md)', gap: '8px', icon: 18 },
  lg: { height: 'var(--control-lg)', padding: '0 var(--space-6)', font: 'var(--fs-lg)', radius: 'var(--radius-lg)', gap: '10px', icon: 20 },
};

function palette(variant) {
  switch (variant) {
    case 'accent':
      return { bg: 'var(--accent)', bgHover: 'var(--accent-hover)', bgPress: 'var(--accent-press)', fg: 'var(--on-accent)', border: 'transparent', shadow: 'var(--shadow-sm)' };
    case 'energy':
      return { bg: 'var(--energy)', bgHover: 'var(--energy-hover)', bgPress: 'var(--energy-press)', fg: 'var(--on-energy)', border: 'transparent', shadow: 'var(--shadow-energy)' };
    case 'danger':
      return { bg: 'var(--danger)', bgHover: 'var(--danger)', bgPress: 'var(--danger)', fg: '#fff', border: 'transparent', shadow: 'var(--shadow-sm)' };
    case 'secondary':
      return { bg: 'var(--surface-2)', bgHover: 'var(--surface-3)', bgPress: 'var(--surface-3)', fg: 'var(--text)', border: 'transparent', shadow: 'none' };
    case 'outline':
      return { bg: 'transparent', bgHover: 'var(--surface-2)', bgPress: 'var(--surface-3)', fg: 'var(--text)', border: 'var(--border-strong)', shadow: 'none' };
    case 'ghost':
      return { bg: 'transparent', bgHover: 'var(--surface-2)', bgPress: 'var(--surface-3)', fg: 'var(--text)', border: 'transparent', shadow: 'none' };
    case 'primary':
    default:
      return { bg: 'var(--primary)', bgHover: 'var(--primary-hover)', bgPress: 'var(--primary-press)', fg: 'var(--on-primary)', border: 'transparent', shadow: 'var(--shadow-brand)' };
  }
}

export function Button({
  variant = 'primary', size = 'md', iconLeft, iconRight, fullWidth = false,
  disabled = false, loading = false, type = 'button', as = 'button',
  href, onClick, children, style, ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const p = palette(variant);
  const isDisabled = disabled || loading;

  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: s.gap, height: s.height, padding: s.padding, width: fullWidth ? '100%' : 'auto',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: s.font,
    letterSpacing: '-0.01em', lineHeight: 1, whiteSpace: 'nowrap',
    color: p.fg, background: press ? p.bgPress : hover ? p.bgHover : p.bg,
    border: `1.5px solid ${p.border === 'transparent' ? 'transparent' : (hover ? 'var(--border-strong)' : p.border)}`,
    borderRadius: s.radius, cursor: isDisabled ? 'not-allowed' : 'pointer',
    boxShadow: focus ? `${p.shadow === 'none' ? '' : p.shadow + ', '}var(--focus-ring)` : (hover && p.shadow !== 'none' ? p.shadow : (p.shadow === 'none' ? 'none' : 'var(--shadow-xs)')),
    transform: press && !isDisabled ? 'translateY(1px) scale(0.99)' : 'none',
    opacity: isDisabled ? 0.55 : 1,
    transition: 'background var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)',
    outline: 'none', userSelect: 'none', textDecoration: 'none', ...style,
  };

  const handlers = {
    onMouseEnter: () => setHover(true), onMouseLeave: () => { setHover(false); setPress(false); },
    onMouseDown: () => setPress(true), onMouseUp: () => setPress(false),
    onFocus: () => setFocus(true), onBlur: () => setFocus(false),
    onClick: isDisabled ? (e) => e.preventDefault() : onClick,
  };

  const content = (
    <>
      {loading && <Spinner size={s.icon} />}
      {!loading && iconLeft && <span style={{ display: 'inline-flex', width: s.icon, height: s.icon }}>{iconLeft}</span>}
      {children}
      {!loading && iconRight && <span style={{ display: 'inline-flex', width: s.icon, height: s.icon }}>{iconRight}</span>}
    </>
  );

  if (as === 'a') {
    return <a href={isDisabled ? undefined : href} style={base} {...handlers} {...rest}>{content}</a>;
  }
  return <button type={type} disabled={isDisabled} style={base} {...handlers} {...rest}>{content}</button>;
}

function Spinner({ size = 18 }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      border: '2px solid color-mix(in srgb, currentColor 35%, transparent)',
      borderTopColor: 'currentColor', display: 'inline-block',
      animation: 'sm-spin 0.7s linear infinite',
    }}>
      <style>{'@keyframes sm-spin{to{transform:rotate(360deg)}}'}</style>
    </span>
  );
}
