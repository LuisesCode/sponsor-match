import * as React from 'react';

export interface RatingStarsProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'style' | 'onChange'> {
  /** Current rating, supports fractions (e.g. 4.5) */
  value?: number;
  /** Total stars. @default 5 */
  max?: number;
  /** Number of ratings, shown as "(123)" */
  count?: number;
  /** Star pixel size. @default 18 */
  size?: number;
  /** Show the numeric value (German comma) */
  showValue?: boolean;
  /** Allow clicking to set a rating */
  interactive?: boolean;
  onChange?: (value: number) => void;
  style?: React.CSSProperties;
}

/** Star rating — read-only display (fractional) or interactive input. */
export function RatingStars(props: RatingStarsProps): JSX.Element;
