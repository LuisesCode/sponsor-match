import * as React from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style' | 'size'> {
  /** Field label rendered above the control */
  label?: string;
  /** Helper text below the field */
  hint?: string;
  /** Error message — turns the field red and replaces hint */
  error?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
  wrapStyle?: React.CSSProperties;
}

/** Text input with label, hint/error states and optional leading/trailing icons. */
export function Input(props: InputProps): JSX.Element;
