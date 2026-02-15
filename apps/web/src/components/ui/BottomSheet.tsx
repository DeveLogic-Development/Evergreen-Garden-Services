import type { PropsWithChildren } from 'react';
import { cn } from '@/utils/cn';

type BottomSheetProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title?: string;
}>;

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps): React.JSX.Element {
  return (
    <>
      <button
        className={cn(
          'fixed inset-0 z-[70] bg-brand-900/50 transition',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-label="Close"
      />
      <section
        className={cn(
          'fixed inset-x-0 bottom-0 z-[80] max-h-[84vh] rounded-t-3xl border border-surface/70 bg-surface/85 p-4 shadow-glass backdrop-blur-xl transition-transform',
          open ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="mx-auto max-w-xl">
          <div className="mb-3 flex items-center justify-between">
            <div className="h-1.5 w-14 rounded-full bg-brand-300" />
            <button className="tap-target text-xs font-semibold text-brand-700" onClick={onClose}>
              Close
            </button>
          </div>
          {title ? <h3 className="mb-3 text-sm font-semibold text-brand-900">{title}</h3> : null}
          <div className="space-y-3 overflow-auto pb-3">{children}</div>
        </div>
      </section>
    </>
  );
}
