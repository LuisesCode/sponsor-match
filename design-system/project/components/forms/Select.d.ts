import * as React from 'react';

export interface SelectOption { value: string; label: string; }

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'style' | 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  /** Options as strings or {value,label}. Or pass <option> children. */
  options?: (string | SelectOption)[];
  placeholder?: string;
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
  wrapStyle?: React.CSSProperties;
}

/** Native select styled to match Input, with a custom chevron. */
export function Select(props: SelectProps): JSX.Element;
