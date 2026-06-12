import * as React from 'react';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  /** Visual style. @default "primary" */
  variant?: 'primary' | 'accent' | 'energy' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** Control height. @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Icon node rendered before the label */
  iconLeft?: React.ReactNode;
  /** Icon node rendered after the label */
  iconRight?: React.ReactNode;
  /** Stretch to fill container width */
  fullWidth?: boolean;
  /** Show spinner and disable */
  loading?: boolean;
  /** Render as <a> instead of <button> */
  as?: 'button' | 'a';
  href?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * Primary action control for SponsorMatch. Use `primary` (navy) for the main action,
 * `energy` (orange) for sporty highlight CTAs, `accent` (teal) for deal/confirm actions.
 *
 * @startingPoint section="Forms" subtitle="Buttons in allen Varianten & Größen" viewport="700x220"
 */
export function Button(props: ButtonProps): JSX.Element;
