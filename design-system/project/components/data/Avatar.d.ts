import * as React from 'react';

export interface AvatarProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'style'> {
  /** Image URL — falls back to initials from `name` */
  src?: string;
  /** Full name, used for initials + alt */
  name?: string;
  /** Named size or pixel number. @default "md" */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Show verified ring + check badge */
  verified?: boolean;
  /** Presence dot (ignored when verified) */
  status?: 'online' | 'busy' | 'offline';
  /** @default "circle" */
  shape?: 'circle' | 'square';
  style?: React.CSSProperties;
}

/** User/brand avatar with initials fallback, verified ring, and presence dot. */
export function Avatar(props: AvatarProps): JSX.Element;
