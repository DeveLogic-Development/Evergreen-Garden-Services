import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/Badge';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { FormInput } from '@/components/ui/Input';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth/AuthProvider';
import type { Invoice } from '@/types/db';
import { getPublicSettings, listMyInvoices, uploadProofOfPayment } from '@/lib/api';
import { formatCurrency, formatDate, formatInvoiceNumber, isOverdue } from '@/utils/format';
import { useToast } from '@/components/Toast';

const toneMap: Record<string, 'neutral' | 'brand' | 'success' | 'warning' | 'danger'> = {
  draft: 'neutral',
  sent: 'warning',
  overdue: 'danger',
  paid: 'success',
  void: 'danger',
};

export function InvoicesPage(): React.JSX.Element {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['my-invoices'], queryFn: listMyInvoices });
  const settingsQuery = useQuery({ queryKey: ['settings-public'], queryFn: getPublicSettings });
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');

  const selectedStatusLabel = useMemo(() => {
    if (!selected) {
      return '';
    }
    if (isOverdue(selected.due_date, selected.status)) {
      return 'overdue';
    }
    return selected.status;
  }, [selected]);

  const overdueCount = useMemo(
    () => (query.data ?? []).filter((invoice) => isOverdue(invoice.due_date, invoice.status)).length,
    [query.data],
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selected || !file || !user) {
        throw new Error('Select invoice and POP file');
      }

      await uploadProofOfPayment({
        invoiceId: selected.id,
        customerId: user.id,
        file,
        amount: Number(amount || selected.total),
        reference: reference || undefined,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-invoices'] });
      setFile(null);
      setReference('');
      setAmount('');
      pushToast('Proof of payment uploaded', 'success');
      setSelected(null);
    },
    onError: (error) => {
      pushToast((error as Error).message, 'error');
    },
  });

  return (
    <div className="space-y-3 pb-32">
      <div>
        <h1 className="text-2xl font-semibold text-brand-900">Invoices</h1>
        <p className="text-sm text-brand-700">View totals, due dates, and upload EFT proof quickly.</p>
      </div>

      {overdueCount > 0 ? (
        <GlassCard className="border border-accent-600 bg-accent-500/85 text-brand-900">
          <p className="text-sm font-semibold">Payment reminder: {overdueCount} invoice(s) overdue</p>
          <p className="mt-1 text-xs">Please upload proof of payment to help us reconcile quickly.</p>
        </GlassCard>
      ) : null}

      {query.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : null}

      {(query.data ?? []).map((invoice) => {
        const label = isOverdue(invoice.due_date, invoice.status) ? 'overdue' : invoice.status;
        const tone = toneMap[label] ?? 'neutral';

        return (
          <GlassCard key={invoice.id} className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-brand-900">Invoice {formatInvoiceNumber(invoice.invoice_number)}</p>
                <p className="text-xs text-brand-700">Due {formatDate(invoice.due_date)}</p>
              </div>
              <StatusBadge tone={tone}>{label}</StatusBadge>
            </div>

            <div className="rounded-2xl border border-surface/75 bg-surface/75 p-3">
              <p className="text-xs uppercase tracking-wide text-brand-700">Amount due</p>
              <p className="text-lg font-semibold text-brand-900">{formatCurrency(invoice.total)}</p>
            </div>

            <SecondaryButton
              fullWidth
              onClick={() => {
                setSelected(invoice);
                setAmount(String(invoice.total));
              }}
            >
              Open invoice
            </SecondaryButton>
          </GlassCard>
        );
      })}

      {!query.isLoading && (query.data ?? []).length === 0 ? (
        <EmptyState title="No invoices yet" description="Invoices will appear once sent by the admin team." />
      ) : null}

      <BottomSheet
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Invoice ${formatInvoiceNumber(selected.invoice_number)}` : ''}
      >
        {selected ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-brand-700">Due {formatDate(selected.due_date)}</p>
              <StatusBadge tone={toneMap[selectedStatusLabel] ?? 'neutral'}>{selectedStatusLabel}</StatusBadge>
            </div>

            <div className="space-y-2">
              {(selected.invoice_items ?? []).map((item) => (
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

            <div className="rounded-2xl border border-accent-600 bg-accent-500/85 p-3 text-sm text-brand-900">
              <p className="font-semibold">Payment instructions</p>
              <p className="mt-1 whitespace-pre-line">
                {settingsQuery.data?.banking_details ?? 'Bank details will be provided by admin.'}
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-surface/75 bg-surface/75 p-3">
              <p className="text-sm font-semibold text-brand-900">Upload Proof of Payment</p>
              <FormInput
                label="Amount paid"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
              <FormInput
                label="Reference"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                hint="Use your EFT reference if available."
              />
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                  Proof file (image or PDF)
                </span>
                <input
                  className="tap-target min-h-11 w-full rounded-2xl border border-surface/80 bg-surface/80 px-3 py-2 text-sm"
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <Link
              to={`/invoices/${selected.id}/print`}
              className="tap-target inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-brand-300 bg-surface/75 px-3 text-sm font-semibold text-brand-800"
            >
              Download / Print
            </Link>

            <div className="sticky bottom-0 grid grid-cols-2 gap-2 rounded-2xl bg-surface/90 p-2 backdrop-blur">
              <SecondaryButton fullWidth onClick={() => setSelected(null)}>
                Close
              </SecondaryButton>
              <PrimaryButton
                fullWidth
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || !file}
              >
                {mutation.isPending ? 'Uploading...' : 'Upload POP'}
              </PrimaryButton>
            </div>
          </>
        ) : null}
      </BottomSheet>
    </div>
  );
}
