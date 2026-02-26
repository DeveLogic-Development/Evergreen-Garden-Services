import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GlassCard } from '@/components/ui/GlassCard';
import { FormInput } from '@/components/ui/Input';
import { AppButton, PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  createInvoiceWithItems,
  getSettings,
  getSignedDocumentUrl,
  listAllBookings,
  listAllInvoices,
  listAllQuotes,
  listProfiles,
  markInvoicePaid,
  sendInvoiceToCustomer,
} from '@/lib/api';
import { useToast } from '@/components/Toast';
import { formatCurrency, formatDate, isOverdue } from '@/utils/format';
import type { PaymentMethod } from '@/types/db';
import { sendWebEmailNotification } from '@/lib/emailNotifications';

type LineItem = { description: string; qty: string; unit_price: string };

const emptyItem = (): LineItem => ({ description: '', qty: '1', unit_price: '0' });

export function AdminInvoicesPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [searchParams] = useSearchParams();
  const invoicesQuery = useQuery({ queryKey: ['admin-invoices'], queryFn: listAllInvoices });
  const bookingsQuery = useQuery({ queryKey: ['admin-bookings-all'], queryFn: () => listAllBookings() });
  const quotesQuery = useQuery({ queryKey: ['admin-quotes'], queryFn: listAllQuotes });
  const profilesQuery = useQuery({ queryKey: ['admin-profiles'], queryFn: listProfiles });
  const settingsQuery = useQuery({ queryKey: ['admin-settings-lite'], queryFn: getSettings });

  const [customerId, setCustomerId] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [quoteId, setQuoteId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [vatRate, setVatRate] = useState('0.15');
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!customerId) {
        throw new Error('Select a customer');
      }
      if (!issueDate || !dueDate) {
        throw new Error('Issue and due date are required');
      }

      const parsedItems = items
        .map((item) => ({
          description: item.description.trim(),
          qty: Number(item.qty),
          unit_price: Number(item.unit_price),
        }))
        .filter((item) => item.description.length > 0);

      if (parsedItems.length === 0) {
        throw new Error('Add at least one line item');
      }

      const invoiceId = await createInvoiceWithItems({
        customer_id: customerId,
        booking_id: bookingId || null,
        quote_id: quoteId || null,
        issue_date: issueDate,
        due_date: dueDate,
        vat_rate: Number(vatRate),
        items: parsedItems,
      });

      const emailResult = await sendInvoiceToCustomer(invoiceId);
      const customerName = (profilesQuery.data ?? []).find((profile) => profile.id === customerId)?.full_name ?? 'Customer';
      const bookingName = (bookingsQuery.data ?? []).find((booking) => booking.id === bookingId)?.services?.name ?? '';
      void sendWebEmailNotification({
        type: 'invoice_created',
        title: 'Invoice created',
        summary: bookingName ? `${customerName} (${bookingName})` : `${customerName} invoice`,
        details: {
          customer_name: customerName,
          service: bookingName,
          created_from: quoteId ? 'quote' : bookingId ? 'booking' : 'manual',
          issue_date: issueDate,
          due_date: dueDate,
          vat_rate: vatRate,
          item_count: parsedItems.length,
        },
      });
      return { emailResult };
    },
    onSuccess: async ({ emailResult }) => {
      await queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      await queryClient.invalidateQueries({ queryKey: ['my-invoices'] });
      if (emailResult.emailed) {
        pushToast('Invoice created and emailed to customer', 'success');
      } else {
        pushToast(emailResult.message ?? 'Invoice created and visible to customer in-app', 'info');
      }
      setCustomerId('');
      setBookingId('');
      setQuoteId('');
      setIssueDate('');
      setDueDate('');
      setItems([emptyItem()]);
      setVatRate(String(settingsQuery.data?.vat_rate ?? 0.15));
    },
    onError: (error) => pushToast((error as Error).message, 'error'),
  });

  const markPaidMutation = useMutation({
    mutationFn: async ({ invoiceId, method }: { invoiceId: string; method: PaymentMethod }) => {
      const invoice = (invoicesQuery.data ?? []).find((row) => row.id === invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      await markInvoicePaid({
        invoice_id: invoiceId,
        method,
        amount: invoice.total,
        reference: invoice.invoice_number,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      pushToast('Invoice marked as paid', 'success');
    },
    onError: (error) => pushToast((error as Error).message, 'error'),
  });

  const quoteOptions = useMemo(
    () => (quotesQuery.data ?? []).filter((quote) => !customerId || quote.customer_id === customerId),
    [quotesQuery.data, customerId],
  );

  const bookingOptions = useMemo(
    () => (bookingsQuery.data ?? []).filter((booking) => !customerId || booking.customer_id === customerId),
    [bookingsQuery.data, customerId],
  );

  const overdueCount = useMemo(
    () => (invoicesQuery.data ?? []).filter((invoice) => isOverdue(invoice.due_date, invoice.status)).length,
    [invoicesQuery.data],
  );

  useEffect(() => {
    const customerIdFromQuery = searchParams.get('customerId');
    if (customerIdFromQuery && !customerId) {
      setCustomerId(customerIdFromQuery);
    }

    const bookingIdFromQuery = searchParams.get('bookingId');
    if (bookingIdFromQuery && !bookingId) {
      setBookingId(bookingIdFromQuery);
    }
  }, [searchParams, customerId, bookingId]);

  return (
    <div className="space-y-3">
      <header>
        <h1 className="text-2xl font-semibold text-brand-900">Invoices</h1>
        <p className="text-sm text-brand-700">Issue invoices, track payments, and export records.</p>
      </header>

      {overdueCount > 0 ? (
        <GlassCard className="border border-accent-600 bg-accent-500/85 text-brand-900">
          <p className="text-sm font-semibold">Payment follow-up flag: {overdueCount} overdue invoice(s)</p>
          <p className="mt-1 text-xs">These customers have not completed payment by due date.</p>
        </GlassCard>
      ) : null}

      <GlassCard className="space-y-3">
        <h2 className="text-base font-semibold text-brand-900">Create invoice</h2>
        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">Customer</span>
          <select
            className="tap-target min-h-11 w-full rounded-2xl border border-surface/80 bg-surface/75 px-3 text-sm"
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
          >
            <option value="">Select customer</option>
            {(profilesQuery.data ?? []).map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.full_name ?? profile.id}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-2 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">Booking (optional)</span>
            <select
              className="tap-target min-h-11 w-full rounded-2xl border border-surface/80 bg-surface/75 px-3 text-sm"
              value={bookingId}
              onChange={(event) => setBookingId(event.target.value)}
            >
              <option value="">None</option>
              {bookingOptions.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.id.slice(0, 8)} - {booking.services?.name ?? 'Service'}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">Quote (optional)</span>
            <select
              className="tap-target min-h-11 w-full rounded-2xl border border-surface/80 bg-surface/75 px-3 text-sm"
              value={quoteId}
              onChange={(event) => setQuoteId(event.target.value)}
            >
              <option value="">None</option>
              {quoteOptions.map((quote) => (
                <option key={quote.id} value={quote.id}>
                  {quote.quote_number}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          <FormInput label="Issue date" type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
          <FormInput label="Due date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          <FormInput label="VAT rate" type="number" step="0.01" value={vatRate} onChange={(event) => setVatRate(event.target.value)} />
        </div>

        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="grid gap-2 rounded-2xl border border-surface/80 bg-surface/75 p-3 sm:grid-cols-3">
              <FormInput
                label="Description"
                value={item.description}
                onChange={(event) =>
                  setItems((current) => {
                    const next = [...current];
                    const currentItem = next[index] ?? emptyItem();
                    next[index] = { ...currentItem, description: event.target.value };
                    return next;
                  })
                }
              />
              <FormInput
                label="Qty"
                type="number"
                value={item.qty}
                onChange={(event) =>
                  setItems((current) => {
                    const next = [...current];
                    const currentItem = next[index] ?? emptyItem();
                    next[index] = { ...currentItem, qty: event.target.value };
                    return next;
                  })
                }
              />
              <FormInput
                label="Unit price"
                type="number"
                step="0.01"
                value={item.unit_price}
                onChange={(event) =>
                  setItems((current) => {
                    const next = [...current];
                    const currentItem = next[index] ?? emptyItem();
                    next[index] = { ...currentItem, unit_price: event.target.value };
                    return next;
                  })
                }
              />
            </div>
          ))}

          <div className="flex gap-2">
            <SecondaryButton onClick={() => setItems((current) => [...current, emptyItem()])}>
              Add item
            </SecondaryButton>
            <AppButton
              variant="ghost"
              onClick={() => setItems((current) => (current.length > 1 ? current.slice(0, -1) : current))}
            >
              Remove item
            </AppButton>
          </div>
        </div>

        <PrimaryButton fullWidth onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create invoice'}
        </PrimaryButton>
      </GlassCard>

      {invoicesQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : null}

      <GlassCard className="hidden overflow-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-brand-700">
            <tr>
              <th className="px-2 py-2">Invoice</th>
              <th className="px-2 py-2">Issue</th>
              <th className="px-2 py-2">Due</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {(invoicesQuery.data ?? []).map((invoice) => {
              const label = isOverdue(invoice.due_date, invoice.status) ? 'overdue' : invoice.status;
              return (
                <tr key={invoice.id} className="border-t border-surface/80">
                  <td className="px-2 py-2">{invoice.invoice_number}</td>
                  <td className="px-2 py-2">{formatDate(invoice.issue_date)}</td>
                  <td className="px-2 py-2">{formatDate(invoice.due_date)}</td>
                  <td className="px-2 py-2">{label}</td>
                  <td className="px-2 py-2">{formatCurrency(invoice.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </GlassCard>

      <section className="space-y-3">
        {(invoicesQuery.data ?? []).map((invoice) => {
          const label = isOverdue(invoice.due_date, invoice.status) ? 'overdue' : invoice.status;
          return (
            <GlassCard key={invoice.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-brand-900">Invoice {invoice.invoice_number}</p>
                  <p className="text-xs text-brand-700">
                    Issue {formatDate(invoice.issue_date)} | Due {formatDate(invoice.due_date)}
                  </p>
                  <p className="text-sm text-brand-800">Total {formatCurrency(invoice.total)}</p>
                </div>
                <StatusBadge tone={label === 'paid' ? 'success' : label === 'overdue' ? 'danger' : 'warning'}>
                  {label}
                </StatusBadge>
              </div>

              <SecondaryButton
                fullWidth
                onClick={() => markPaidMutation.mutate({ invoiceId: invoice.id, method: 'eft' })}
                disabled={markPaidMutation.isPending || invoice.status === 'paid'}
              >
                Mark paid (EFT)
              </SecondaryButton>
              <div className="grid grid-cols-2 gap-2">
                <AppButton
                  variant="ghost"
                  className="w-full"
                  onClick={() => markPaidMutation.mutate({ invoiceId: invoice.id, method: 'card' })}
                  disabled={markPaidMutation.isPending || invoice.status === 'paid'}
                >
                  Mark paid (Card)
                </AppButton>
                <AppButton
                  variant="ghost"
                  className="w-full"
                  onClick={() => markPaidMutation.mutate({ invoiceId: invoice.id, method: 'cash' })}
                  disabled={markPaidMutation.isPending || invoice.status === 'paid'}
                >
                  Mark paid (Cash)
                </AppButton>
              </div>

              {(invoice.payments ?? []).map((payment) => (
                <div key={payment.id} className="rounded-2xl border border-surface/80 bg-surface/75 p-3 text-sm">
                  <p className="text-brand-900">
                    Payment {formatCurrency(payment.amount)} ({payment.method})
                  </p>
                  <p className="text-brand-700">Ref: {payment.reference ?? '-'}</p>
                  {payment.proof_file_path ? (
                    <AppButton
                      className="mt-2"
                      variant="secondary"
                      onClick={async () => {
                        try {
                          const url = await getSignedDocumentUrl(payment.proof_file_path as string);
                          window.open(url, '_blank', 'noopener,noreferrer');
                        } catch (error) {
                          pushToast((error as Error).message, 'error');
                        }
                      }}
                    >
                      Download POP
                    </AppButton>
                  ) : null}
                </div>
              ))}
            </GlassCard>
          );
        })}
      </section>
    </div>
  );
}
