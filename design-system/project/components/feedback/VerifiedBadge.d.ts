import * as React from 'react';

export interface VerifiedBadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'style'> {
  /** @default "verified" */
  type?: 'verified' | 'pro' | 'secure';
  /** Show text label; when false renders the icon chip only. @default true */
  showLabel?: boolean;
  /** @default "md" */
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

/** Trust signal — verified identity, Pro account, or secure-payment marker. */
export function VerifiedBadge(props: VerifiedBadgeProps): JSX.Element;
