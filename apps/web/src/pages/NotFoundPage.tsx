import { Link } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';

export function NotFoundPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-md p-4">
      <GlassCard className="space-y-3 text-center">
        <h1 className="text-xl font-semibold text-brand-900">Page not found</h1>
        <Link to="/book" className="text-sm font-medium text-brand-700 underline">
          Go to app
        </Link>
      </GlassCard>
    </div>
  );
}
