import * as React from 'react';

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  /** Lucide icon name (used when `icon` not provided) */
  name?: string;
  /** Custom icon node (overrides `name`) */
  icon?: React.ReactNode;
  /** @default "ghost" */
  variant?: 'ghost' | 'outline' | 'solid' | 'accent';
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Accessible label (required — icon-only) */
  label: string;
  style?: React.CSSProperties;
}

/** Square, icon-only button for toolbars, cards and inline actions. */
export function IconButton(props: IconButtonProps): JSX.Element;
