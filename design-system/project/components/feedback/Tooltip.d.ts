import * as React from 'react';

export interface TooltipProps {
  /** Tooltip text/content */
  content: React.ReactNode;
  /** @default "top" */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Hover delay in ms. @default 80 */
  delay?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/** Wraps a trigger element and shows a dark label on hover/focus. */
export function Tooltip(props: TooltipProps): JSX.Element;
