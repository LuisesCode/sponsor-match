import * as React from 'react';

export interface StatBlockProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  /** Big metric value (e.g. "128K", "€4.250", "4,9") */
  value: React.ReactNode;
  /** Caption under the value */
  label: string;
  /** Delta text (e.g. "+12%"). Sign infers color/arrow unless deltaDirection set. */
  delta?: string;
  deltaDirection?: 'up' | 'down' | 'flat';
  icon?: React.ReactNode;
  /** @default "left" */
  align?: 'left' | 'center';
  style?: React.CSSProperties;
}

/** KPI / metric display with mono value and optional trend delta. */
export function StatBlock(props: StatBlockProps): JSX.Element;
