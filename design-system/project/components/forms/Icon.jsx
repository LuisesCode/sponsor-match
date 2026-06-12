import React from 'react';

/**
 * SponsorMatch — Icon (Lucide wrapper)
 * Requires the Lucide UMD script to be present on the page:
 *   <script src="https://unpkg.com/lucide@latest"></script>
 * Renders a Lucide icon by name; re-creates on name/size change.
 */
export function Icon({ name, size = 20, strokeWidth = 2, color = 'currentColor', style, ...rest }) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const lucide = typeof window !== 'undefined' ? window.lucide : null;
    if (lucide && lucide.icons) {
      // Build SVG via createElement when available for reliability
      el.innerHTML = '';
      const span = document.createElement('i');
      span.setAttribute('data-lucide', name);
      el.appendChild(span);
      try { lucide.createIcons({ icons: lucide.icons, attrs: {} }); } catch (e) { /* noop */ }
      const svg = el.querySelector('svg');
      if (svg) {
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('stroke-width', strokeWidth);
      }
    }
  }, [name, size, strokeWidth]);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      style={{ display: 'inline-flex', width: size, height: size, color, flex: '0 0 auto', ...style }}
      {...rest}
    />
  );
}
