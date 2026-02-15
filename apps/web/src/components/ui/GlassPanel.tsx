import type { PropsWithChildren } from 'react';
import { cn } from '@/utils/cn';

type GlassPanelProps = PropsWithChildren<{
  className?: string | undefined;
}>;

export function GlassPanel({ className, children }: GlassPanelProps): React.JSX.Element {
  return <section className={cn('glass-panel rounded-3xl p-3', className)}>{children}</section>;
}
