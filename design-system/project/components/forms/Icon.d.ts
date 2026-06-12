import * as React from 'react';

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Lucide icon name, e.g. "arrow-right", "check", "shield-check" */
  name: string;
  /** Pixel size. @default 20 */
  size?: number;
  /** Stroke width. @default 2 */
  strokeWidth?: number;
  /** Color (defaults to currentColor) */
  color?: string;
}

/** Lucide icon wrapper. Requires the Lucide UMD script on the page. */
export function Icon(props: IconProps): JSX.Element;
