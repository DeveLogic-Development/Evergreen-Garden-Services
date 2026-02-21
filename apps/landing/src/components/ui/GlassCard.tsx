import type { HTMLAttributes } from 'react';

export function GlassCard({ className = '', ...props }: HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={[
        'rounded-2xl border border-surface/60 bg-surface/45 shadow-[0_18px_40px_rgb(var(--color-brand-900-rgb)/0.16)]',
        'backdrop-blur-xl transition duration-300',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}
