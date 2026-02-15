import { StatusBadge } from '@/components/ui/Badge';

type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

type BadgeProps = {
  tone?: BadgeTone;
  children: string;
};

export function Badge({ tone = 'neutral', children }: BadgeProps): React.JSX.Element {
  return <StatusBadge tone={tone}>{children}</StatusBadge>;
}
