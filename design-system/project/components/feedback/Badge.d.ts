import * as React from 'react';

export interface BadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'style'> {
  /** Color tone. @default "neutral" */
  tone?: 'neutral' | 'primary' | 'accent' | 'energy' | 'success' | 'warning' | 'danger' | 'info' | 'solid';
  /** @default "md" */
  size?: 'sm' | 'md';
  /** Leading status dot */
  dot?: boolean;
  /** Leading icon node */
  icon?: React.ReactNode;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/** Compact pill for status, categories and counts. */
export function Badge(props: BadgeProps): JSX.Element;
