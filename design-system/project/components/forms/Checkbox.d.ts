import * as React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style' | 'type'> {
  label?: string;
  /** Secondary line under the label */
  description?: string;
  style?: React.CSSProperties;
}

/** Checkbox with optional label + description. Teal when checked. */
export function Checkbox(props: CheckboxProps): JSX.Element;
