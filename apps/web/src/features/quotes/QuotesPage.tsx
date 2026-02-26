import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Quote } from '@/types/db';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/Badge';
import { AppButton, PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { listMyQuotes, setQuoteStatus } from '@/lib/api';
import { formatCurrency, formatDate, formatQuoteNumber } from '@/utils/format';
import { useToast } from '@/components/Toast';

const toneMap: Record<string, 'neutral' | 'brand' | 'success' | 'warning' | 'danger'> = {
  draft: 'neutral',
  sent: 'warning',
  accepted: 'success',
  declined: 'danger',
  expired: 'danger',
};

export function QuotesPage(): React.JSX.Element {
  const [selected, setSelected] = useState<Quote | null>(null);
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['my-quotes'], queryFn: listMyQuotes });

  const actionable = useMemo(() => selected?.status === 'sent', [selected]);

  const updateStatusMutation = useMutation({
    mutationFn: async (status: 'accepted' | 'declined') => {
      if (!selected) {
        return;
      }
      await setQuoteStatus(selected.id, status, false);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-quotes'] });
      pushToast('Quote updated', 'success');
      setSelected(null);
    },
    onError: (error) => {
      pushToast((error as Error).message, 'error');
    },
  });

  return (
    <div className="space-y-3 pb-32">
      <div>
        <h1 className="text-2xl font-semibold text-brand-900">Quotes</h1>
        <p className="text-sm text-brand-700">Review line items and approve when ready.</p>
      </div>

      {query.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : null}

      {(query.data ?? []).map((quote) => (
        <GlassCard key={quote.id} className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-brand-900">Quote {formatQuoteNumber(quote.quote_number)}</p>
              <p className="text-xs text-brand-700">Valid until {formatDate(quote.valid_until)}</p>
            </div>
            <StatusBadge tone={toneMap[quote.status] ?? 'neutral'}>{quote.status}</StatusBadge>
          </div>

          <div className="rounded-2xl border border-surface/75 bg-surface/75 p-3">
            <p className="text-xs uppercase tracking-wide text-brand-700">Total</p>
            <p className="text-lg font-semibold text-brand-900">{formatCurrency(quote.total)}</p>
          </div>

          <AppButton variant="secondary" fullWidth onClick={() => setSelected(quote)}>
            View quote details
          </AppButton>
        </GlassCard>
      ))}

      {!query.isLoading && (query.data ?? []).length === 0 ? (
        <EmptyState title="No quotes yet" description="Once a quote is issued, it will appear here." />
      ) : null}

      <BottomSheet
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Quote ${formatQuoteNumber(selected.quote_number)}` : ''}
      >
        {selected ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-brand-700">Valid until {formatDate(selected.valid_until)}</p>
              <StatusBadge tone={toneMap[selected.status] ?? 'neutral'}>{selected.status}</StatusBadge>
            </div>

            <div className="space-y-2">
              {(selected.quote_items ?? []).map((item) => (
                <div key={item.id} className="rounded-2xl border border-surface/75 bg-surface/75 p-3 text-sm">
                  <p className="font-semibold text-brand-900">{item.description}</p>
                  <p className="text-brand-700">
                    {item.qty} x {formatCurrency(item.unit_price)} = {formatCurrency(item.line_total)}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-surface/75 bg-surface/75 p-3">
              <p className="flex justify-between text-sm text-brand-800">
                <span>Subtotal</span>
                <span>{formatCurrency(selected.subtotal)}</span>
              </p>
              <p className="mt-1 flex justify-between text-sm text-brand-800">
                <span>VAT</span>
                <span>{formatCurrency(selected.vat_amount)}</span>
              </p>
              <p className="mt-2 flex justify-between text-base font-semibold text-brand-900">
                <span>Total</span>
                <span>{formatCurrency(selected.total)}</span>
              </p>
            </div>

            <Link
              to={`/quotes/${selected.id}/print`}
              className="tap-target inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-brand-300 bg-surface/75 px-3 text-sm font-semibold text-brand-800"
            >
              Download / Print
            </Link>

            {actionable ? (
              <div className="sticky bottom-0 grid grid-cols-2 gap-2 rounded-2xl bg-surface/90 p-2 backdrop-blur">
                <SecondaryButton
                  fullWidth
                  onClick={() => updateStatusMutation.mutate('declined')}
                  disabled={updateStatusMutation.isPending}
                >
                  Decline
                </SecondaryButton>
                <PrimaryButton
                  fullWidth
                  onClick={() => updateStatusMutation.mutate('accepted')}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? 'Saving...' : 'Accept quote'}
                </PrimaryButton>
              </div>
            ) : null}
          </>
        ) : null}
      </BottomSheet>
    </div>
  );
}
