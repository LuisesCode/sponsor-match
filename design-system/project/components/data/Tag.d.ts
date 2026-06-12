import * as React from 'react';

export interface TagProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'style'> {
  /** Selected (filled navy) state */
  selected?: boolean;
  /** Renders an ✕ to remove */
  onRemove?: () => void;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/** Category chip — filter pill, selectable or removable. Larger & more interactive than Badge. */
export function Tag(props: TagProps): JSX.Element;
