import * as React from 'react';

export interface TabItem { value: string; label: string; icon?: React.ReactNode; count?: number; }

export interface TabsProps {
  /** Tabs as strings or {value,label,icon,count} */
  tabs: (string | TabItem)[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** @default "underline" */
  variant?: 'underline' | 'pill';
  style?: React.CSSProperties;
}

/** Tab bar — underline (page sections) or pill (segmented control). */
export function Tabs(props: TabsProps): JSX.Element;
