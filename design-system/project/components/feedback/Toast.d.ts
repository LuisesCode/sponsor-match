import * as React from 'react';

export interface ToastProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style' | 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** @default "neutral" */
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  /** Close handler — renders an ✕ when provided */
  onClose?: () => void;
  /** Optional action node (e.g. a small Button) */
  action?: React.ReactNode;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Notification card with a tonal accent bar. Presentational — position it yourself. */
export function Toast(props: ToastProps): JSX.Element;
