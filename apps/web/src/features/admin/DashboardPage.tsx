import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { getDashboardCounts } from '@/lib/api';

export function DashboardPage(): React.JSX.Element {
  const query = useQuery({ queryKey: ['admin-dashboard-counts'], queryFn: getDashboardCounts });

  const cards = [
    { label: 'Requested bookings', value: query.data?.requestedBookings ?? 0 },
    { label: 'Sent quotes', value: query.data?.sentQuotes ?? 0 },
    { label: 'Open invoices', value: query.data?.sentInvoices ?? 0 },
    { label: 'Overdue invoices', value: query.data?.overdueInvoices ?? 0, alert: true },
    { label: 'Paid invoices', value: query.data?.paidInvoices ?? 0 },
  ];

  return (
    <div className="space-y-3">
      <header>
        <h1 className="text-2xl font-semibold text-brand-900">Admin dashboard</h1>
        <p className="text-sm text-brand-700">A quick pulse of operations today.</p>
      </header>

      {query.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card, index) => (
          <GlassCard
            key={card.label}
            className={
              card.alert && card.value > 0
                ? `h-full space-y-1 border border-accent-600 bg-accent-500/80 ${
                    index === cards.length - 1 ? 'sm:col-span-2 lg:col-span-1' : ''
                  }`
                : `h-full space-y-1 ${index === cards.length - 1 ? 'sm:col-span-2 lg:col-span-1' : ''}`
            }
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{card.label}</p>
            <p className="text-3xl font-bold text-brand-900">{card.value}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="space-y-2">
        <p className="text-sm font-semibold text-brand-900">Automation shortcuts</p>
        <p className="text-xs text-brand-700">
          Manage fixed weekly plans and strict month-end invoicing in Monthly Plans.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            to="/admin/monthly-plans"
            className="tap-target inline-flex min-h-11 items-center justify-center rounded-2xl border border-brand-700 bg-brand-700 px-3 text-sm font-semibold text-text-invert"
          >
            Open monthly plans
          </Link>
          <Link
            to="/admin/calendar"
            className="tap-target inline-flex min-h-11 items-center justify-center rounded-2xl border border-surface/80 bg-surface/75 px-3 text-sm font-semibold text-brand-800"
          >
            Open calendar
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
