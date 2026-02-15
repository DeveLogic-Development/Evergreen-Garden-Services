import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GlassCard } from '@/components/ui/GlassCard';
import { FormInput } from '@/components/ui/Input';
import { PrimaryButton, SecondaryButton, AppButton } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  createInvoiceFromQuote,
  createQuoteWithItems,
  getSettings,
  listAllBookings,
  listAllQuotes,
  sendInvoiceToCustomer,
} from '@/lib/api';
import { formatCurrency, formatDate } from '@/utils/format';
import { useToast } from '@/components/Toast';

type LineItem = { description: string; qty: string; unit_price: string };

const emptyItem = (): LineItem => ({ description: '', qty: '1', unit_price: '0' });

export function AdminQuotesPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [searchParams] = useSearchParams();
  const bookingsQuery = useQuery({ queryKey: ['admin-bookings-all'], queryFn: () => listAllBookings() });
  const quotesQuery = useQuery({ queryKey: ['admin-quotes'], queryFn: listAllQuotes });
  const settingsQuery = useQuery({ queryKey: ['admin-settings-lite'], queryFn: getSettings });

  const [bookingId, setBookingId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [vatRate, setVatRate] = useState('0.15');
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);

  const selectedBooking = useMemo(
    () => (bookingsQuery.data ?? []).find((booking) => booking.id === bookingId),
    [bookingsQuery.data, bookingId],
  );

  useEffect(() => {
    const bookingIdFromQuery = searchParams.get('bookingId');
    if (!bookingIdFromQuery || bookingId || !(bookingsQuery.data ?? []).length) {
      return;
    }
    const bookingExists = (bookingsQuery.data ?? []).some((booking) => booking.id === bookingIdFromQuery);
    if (bookingExists) {
      setBookingId(bookingIdFromQuery);
    }
  }, [searchParams, bookingsQuery.data, bookingId]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBooking) {
        throw new Error('Select a booking');
      }
      if (!validUntil) {
        throw new Error('Select valid until date');
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

      await createQuoteWithItems({
        customer_id: selectedBooking.customer_id,
        booking_id: selectedBooking.id,
        valid_until: validUntil,
        vat_rate: Number(vatRate),
        items: parsedItems,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
      pushToast('Quote created', 'success');
      setBookingId('');
      setValidUntil('');
      setItems([emptyItem()]);
      setVatRate(String(settingsQuery.data?.vat_rate ?? 0.15));
    },
    onError: (error) => pushToast((error as Error).message, 'error'),
  });

  const invoiceFromQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const invoiceId = await createInvoiceFromQuote(quoteId);
      const emailResult = await sendInvoiceToCustomer(invoiceId);
      return emailResult;
    },
    onSuccess: async (emailResult) => {
      await queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      await queryClient.invalidateQueries({ queryKey: ['my-invoices'] });
      if (emailResult.emailed) {
        pushToast('Invoice created and emailed to customer', 'success');
      } else {
        pushToast(emailResult.message ?? 'Invoice created and visible to customer in-app', 'info');
      }
    },
    onError: (error) => pushToast((error as Error).message, 'error'),
  });

  return (
    <div className="space-y-3">
      <header>
        <h1 className="text-2xl font-semibold text-brand-900">Quotes</h1>
        <p className="text-sm text-brand-700">Create polished quotes from booking requests.</p>
      </header>

      <GlassCard className="space-y-3">
        <h2 className="text-base font-semibold text-brand-900">Create quote from booking</h2>

        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">Booking</span>
          <select
            className="tap-target min-h-11 w-full rounded-2xl border border-surface/80 bg-surface/75 px-3 text-sm"
            value={bookingId}
            onChange={(event) => setBookingId(event.target.value)}
          >
            <option value="">Select booking</option>
            {(bookingsQuery.data ?? []).map((booking) => (
              <option key={booking.id} value={booking.id}>
                {(booking.profiles?.full_name ?? 'Customer')} - {(booking.services?.name ?? 'Service')}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-2 sm:grid-cols-2">
          <FormInput
            label="Valid until"
            type="date"
            value={validUntil}
            onChange={(event) => setValidUntil(event.target.value)}
            required
          />
          <FormInput
            label="VAT rate"
            type="number"
            step="0.01"
            value={vatRate}
            onChange={(event) => setVatRate(event.target.value)}
          />
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
          {createMutation.isPending ? 'Creating...' : 'Create quote'}
        </PrimaryButton>
      </GlassCard>

      {quotesQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : null}

      <section className="space-y-3">
        {(quotesQuery.data ?? []).map((quote) => (
          <GlassCard key={quote.id} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-brand-900">Quote {quote.quote_number}</p>
                <p className="text-xs text-brand-700">Valid until {formatDate(quote.valid_until)}</p>
                <p className="text-xs text-brand-700">Total {formatCurrency(quote.total)}</p>
              </div>
              <StatusBadge
                tone={quote.status === 'accepted' ? 'success' : quote.status === 'declined' ? 'danger' : 'warning'}
              >
                {quote.status}
              </StatusBadge>
            </div>
            <SecondaryButton
              fullWidth
              onClick={() => invoiceFromQuoteMutation.mutate(quote.id)}
              disabled={invoiceFromQuoteMutation.isPending}
            >
              Create and send invoice
            </SecondaryButton>
          </GlassCard>
        ))}
      </section>
    </div>
  );
}
