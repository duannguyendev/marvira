'use client';

import { useState, type ReactNode } from 'react';

interface AdvancedFieldsProps {
  children: ReactNode;
  /** Shown on the summary row */
  label?: string;
  /** Start expanded (e.g. when editing non-default values) */
  defaultOpen?: boolean;
}

/** Collapsed by default so create/edit forms stay focused on essentials. */
export function AdvancedFields({
  children,
  label = 'Advanced options',
  defaultOpen = false,
}: AdvancedFieldsProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details
      className="rounded-md border border-border bg-muted/30"
      open={open}
      onToggle={event => {
        setOpen(event.currentTarget.open);
      }}>
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        {label}
      </summary>
      <div className="space-y-4 border-t border-border px-3 py-3">{children}</div>
    </details>
  );
}
