import { GlassCard } from './GlassCard';

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps): React.JSX.Element {
  return (
    <GlassCard className="text-center">
      <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-accent-500/60 p-4 text-brand-900">
        <svg viewBox="0 0 24 24" fill="none" className="h-full w-full stroke-current">
          <path d="M12 3v18M3 12h18" strokeWidth="1.5" />
        </svg>
      </div>
      <p className="text-base font-semibold text-brand-900">{title}</p>
      <p className="mt-1 text-sm text-brand-700">{description}</p>
    </GlassCard>
  );
}
