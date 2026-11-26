import type { CSSProperties } from 'react';
import { Toaster as Sonner } from 'sonner';

import { useTheme } from '@/features/theme/theme-provider';

export function Toaster() {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      toastOptions={{
        style: {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as CSSProperties,
      }}
    />
  );
}
