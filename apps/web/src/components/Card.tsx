import type { PropsWithChildren } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ className, children }: CardProps): React.JSX.Element {
  return <GlassCard className={className}>{children}</GlassCard>;
}
