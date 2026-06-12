import * as React from 'react';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  /** @default "md" */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Lift + stronger shadow on hover */
  interactive?: boolean;
  /** Optional top accent border color, e.g. "var(--accent)" */
  accent?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/** Rounded surface container — the base for most SponsorMatch content blocks. */
export function Card(props: CardProps): JSX.Element;
