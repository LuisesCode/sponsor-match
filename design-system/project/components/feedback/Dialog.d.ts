import * as React from 'react';

export interface DialogProps {
  /** @default true */
  open?: boolean;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  /** Footer node, usually action Buttons */
  footer?: React.ReactNode;
  /** Called on overlay click, ✕, or Escape */
  onClose?: () => void;
  /** Card width in px. @default 480 */
  width?: number;
  style?: React.CSSProperties;
}

/** Centered modal with overlay blur, title/description, body and footer. */
export function Dialog(props: DialogProps): JSX.Element;
