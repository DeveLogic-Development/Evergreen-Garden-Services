import type { PropsWithChildren } from 'react';
import { cn } from '@/utils/cn';

type GlassCardProps = PropsWithChildren<{
  className?: string | undefined;
  compact?: boolean | undefined;
}>;

export function GlassCard({ className, compact = false, children }: GlassCardProps): React.JSX.Element {
  return (
    <section
      className={cn(
        'glass-card animate-float-in rounded-3xl',
        compact ? 'p-3' : 'p-4',
        className,
      )}
    >
      {children}
    </section>
  );
}
