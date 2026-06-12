import * as React from 'react';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style' | 'type'> {
  label?: string;
  description?: string;
  value: string;
  style?: React.CSSProperties;
}

export interface RadioGroupProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Single radio option. */
export function Radio(props: RadioProps): JSX.Element;
/** Wraps Radio children, wiring a shared name + selected value. */
export function RadioGroup(props: RadioGroupProps): JSX.Element;
