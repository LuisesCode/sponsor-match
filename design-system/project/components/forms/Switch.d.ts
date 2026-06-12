import * as React from 'react';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style' | 'type' | 'size'> {
  label?: string;
  description?: string;
  /** @default "md" */
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

/** On/off toggle for settings & preferences. Teal when on. */
export function Switch(props: SwitchProps): JSX.Element;
