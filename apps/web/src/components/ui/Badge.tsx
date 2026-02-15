import { cn } from '@/utils/cn';

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

const map: Record<Tone, string> = {
  neutral: 'border border-brand-300 bg-surface/70 text-brand-800',
  brand: 'border border-brand-500 bg-brand-300/85 text-brand-900',
  success: 'border border-brand-500 bg-brand-400 text-text-invert',
  warning: 'border border-accent-600 bg-accent-500 text-brand-900',
  danger: 'border border-brand-900 bg-brand-900 text-text-invert',
};

type StatusBadgeProps = {
  tone?: Tone;
  children: string;
};

export function StatusBadge({ tone = 'neutral', children }: StatusBadgeProps): React.JSX.Element {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold', map[tone])}>
      {children}
    </span>
  );
}
