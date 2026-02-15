import type { PropsWithChildren } from 'react';
import { cn } from '@/utils/cn';

type DrawerProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
}>;

export function Drawer({ open, onClose, children }: DrawerProps): React.JSX.Element {
  return (
    <>
      <button
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-brand-900/45 transition md:hidden',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-label="Close menu"
      />
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-72 border-r border-surface/60 bg-surface/75 p-4 shadow-glass backdrop-blur-2xl transition-transform md:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {children}
      </aside>
    </>
  );
}
