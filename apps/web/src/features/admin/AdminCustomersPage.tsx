import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { listAllBookings, listAllInvoices, listAllQuotes, listProfiles } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime, formatInvoiceNumber, formatQuoteNumber, isOverdue } from '@/utils/format';

const bookingTone = {
  requested: 'warning',
  confirmed: 'brand',
  completed: 'success',
  cancelled: 'danger',
} as const;

const quoteTone = {
  draft: 'neutral',
  sent: 'warning',
  accepted: 'success',
  declined: 'danger',
  expired: 'danger',
} as const;

export function AdminCustomersPage(): React.JSX.Element {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const customersQuery = useQuery({ queryKey: ['admin-profiles'], queryFn: listProfiles });
  const bookingsQuery = useQuery({ queryKey: ['admin-bookings-all'], queryFn: () => listAllBookings() });
  const quotesQuery = useQuery({ queryKey: ['admin-quotes'], queryFn: listAllQuotes });
  const invoicesQuery = useQuery({ queryKey: ['admin-invoices'], queryFn: listAllInvoices });

  const loading =
    customersQuery.isLoading || bookingsQuery.isLoading || quotesQuery.isLoading || invoicesQuery.isLoading;

  const summaryByCustomer = useMemo(() => {
    const bookingCounts = new Map<string, number>();
    const quoteCounts = new Map<string, number>();
    const invoiceCounts = new Map<string, number>();

    for (const booking of bookingsQuery.data ?? []) {
      bookingCounts.set(booking.customer_id, (bookingCounts.get(booking.customer_id) ?? 0) + 1);
    }
    for (const quote of quotesQuery.data ?? []) {
      quoteCounts.set(quote.customer_id, (quoteCounts.get(quote.customer_id) ?? 0) + 1);
    }
    for (const invoice of invoicesQuery.data ?? []) {
      invoiceCounts.set(invoice.customer_id, (invoiceCounts.get(invoice.customer_id) ?? 0) + 1);
    }

    return { bookingCounts, quoteCounts, invoiceCounts };
  }, [bookingsQuery.data, quotesQuery.data, invoicesQuery.data]);

  const selectedCustomer = useMemo(
    () => (customersQuery.data ?? []).find((customer) => customer.id === selectedCustomerId) ?? null,
    [customersQuery.data, selectedCustomerId],
  );

  const selectedBookings = useMemo(
    () =>
      (bookingsQuery.data ?? [])
        .filter((booking) => booking.customer_id === selectedCustomerId)
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    [bookingsQuery.data, selectedCustomerId],
  );

  const selectedQuotes = useMemo(
    () =>
      (quotesQuery.data ?? [])
        .filter((quote) => quote.customer_id === selectedCustomerId)
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    [quotesQuery.data, selectedCustomerId],
  );

  const selectedInvoices = useMemo(
    () =>
      (invoicesQuery.data ?? [])
        .filter((invoice) => invoice.customer_id === selectedCustomerId)
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    [invoicesQuery.data, selectedCustomerId],
  );

  const paymentRows = useMemo(
    () =>
      selectedInvoices.flatMap((invoice) =>
        (invoice.payments ?? []).map((payment) => ({
          invoice_number: invoice.invoice_number,
          amount: payment.amount,
          method: payment.method,
          reference: payment.reference,
          created_at: payment.created_at,
        })),
      ),
    [selectedInvoices],
  );

  const financialSummary = useMemo(() => {
    const invoiced = selectedInvoices.reduce((acc, invoice) => acc + Number(invoice.total), 0);
    const paid = paymentRows.reduce((acc, payment) => acc + Number(payment.amount), 0);
    const overdue = selectedInvoices.filter((invoice) => isOverdue(invoice.due_date, invoice.status)).length;
    return {
      invoiced,
      paid,
      outstanding: Math.max(invoiced - paid, 0),
      overdue,
    };
  }, [selectedInvoices, paymentRows]);

  return (
    <div className="space-y-3 pb-20">
      <header>
        <h1 className="text-2xl font-semibold text-brand-900">Customers</h1>
        <p className="text-sm text-brand-700">View each customer profile with booking and financial history.</p>
      </header>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : null}

      {!loading && (customersQuery.data ?? []).length === 0 ? (
        <EmptyState title="No customers yet" description="Customers will appear after they create accounts." />
      ) : null}

      <section className="space-y-2">
        {(customersQuery.data ?? []).map((customer) => {
          const bookingCount = summaryByCustomer.bookingCounts.get(customer.id) ?? 0;
          const quoteCount = summaryByCustomer.quoteCounts.get(customer.id) ?? 0;
          const invoiceCount = summaryByCustomer.invoiceCounts.get(customer.id) ?? 0;
          const isSelected = selectedCustomerId === customer.id;
          return (
            <button
              key={customer.id}
              onClick={() => setSelectedCustomerId(customer.id)}
              className={
                isSelected
                  ? 'w-full text-left'
                  : 'w-full text-left transition hover:opacity-95'
              }
            >
              <GlassCard className={isSelected ? 'space-y-2 border border-brand-700' : 'space-y-2'}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-brand-900">{customer.full_name ?? 'Unnamed customer'}</p>
                    <p className="text-xs text-brand-700">{customer.phone ?? 'No phone'}</p>
                    <p className="mt-1 text-xs text-brand-700">{customer.address ?? 'No address'}</p>
                  </div>
                  <StatusBadge tone={isSelected ? 'brand' : 'neutral'}>{isSelected ? 'Viewing' : 'Open'}</StatusBadge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-xl border border-surface/80 bg-surface/75 px-2 py-1.5 text-center text-brand-800">
                    {bookingCount} bookings
                  </div>
                  <div className="rounded-xl border border-surface/80 bg-surface/75 px-2 py-1.5 text-center text-brand-800">
                    {quoteCount} quotes
                  </div>
                  <div className="rounded-xl border border-surface/80 bg-surface/75 px-2 py-1.5 text-center text-brand-800">
                    {invoiceCount} invoices
                  </div>
                </div>
              </GlassCard>
            </button>
          );
        })}
      </section>

      {selectedCustomer ? (
        <section className="space-y-3">
          <GlassCard className="space-y-2">
            <p className="text-sm font-semibold text-brand-900">Customer details</p>
            <p className="text-xs text-brand-700">Name: {selectedCustomer.full_name ?? '-'}</p>
            <p className="text-xs text-brand-700">Phone: {selectedCustomer.phone ?? '-'}</p>
            <p className="text-xs text-brand-700 whitespace-pre-line">Address: {selectedCustomer.address ?? '-'}</p>
          </GlassCard>

          <GlassCard className="space-y-2">
            <p className="text-sm font-semibold text-brand-900">Financial summary</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-2xl border border-surface/80 bg-surface/75 p-2">
                <p className="text-xs text-brand-700">Invoiced</p>
                <p className="font-semibold text-brand-900">{formatCurrency(financialSummary.invoiced)}</p>
              </div>
              <div className="rounded-2xl border border-surface/80 bg-surface/75 p-2">
                <p className="text-xs text-brand-700">Paid</p>
                <p className="font-semibold text-brand-900">{formatCurrency(financialSummary.paid)}</p>
              </div>
              <div className="rounded-2xl border border-surface/80 bg-surface/75 p-2">
                <p className="text-xs text-brand-700">Outstanding</p>
                <p className="font-semibold text-brand-900">{formatCurrency(financialSummary.outstanding)}</p>
              </div>
              <div className="rounded-2xl border border-surface/80 bg-surface/75 p-2">
                <p className="text-xs text-brand-700">Overdue invoices</p>
                <p className="font-semibold text-brand-900">{financialSummary.overdue}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="space-y-2">
            <p className="text-sm font-semibold text-brand-900">Booking history</p>
            {selectedBookings.length === 0 ? <p className="text-xs text-brand-700">No bookings yet.</p> : null}
            {selectedBookings.map((booking) => (
              <div key={booking.id} className="rounded-2xl border border-surface/80 bg-surface/75 p-3 text-xs">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="font-semibold text-brand-900">{booking.services?.name ?? 'Service'}</p>
                  <StatusBadge tone={bookingTone[booking.status]}>{booking.status}</StatusBadge>
                </div>
                <p className="text-brand-700">Requested: {formatDateTime(booking.requested_datetime)}</p>
                {booking.confirmed_datetime ? (
                  <p className="text-brand-700">Confirmed: {formatDateTime(booking.confirmed_datetime)}</p>
                ) : null}
                <p className="mt-1 whitespace-pre-line text-brand-700">{booking.address}</p>
                {booking.notes ? <p className="mt-1 text-brand-700">Notes: {booking.notes}</p> : null}
              </div>
            ))}
          </GlassCard>

          <GlassCard className="space-y-2">
            <p className="text-sm font-semibold text-brand-900">Financial history</p>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Quotes</p>
              {selectedQuotes.length === 0 ? <p className="text-xs text-brand-700">No quotes yet.</p> : null}
              {selectedQuotes.map((quote) => (
                <div key={quote.id} className="rounded-2xl border border-surface/80 bg-surface/75 p-3 text-xs">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="font-semibold text-brand-900">{formatQuoteNumber(quote.quote_number)}</p>
                    <StatusBadge tone={quoteTone[quote.status]}>{quote.status}</StatusBadge>
                  </div>
                  <p className="text-brand-700">Valid until: {formatDate(quote.valid_until)}</p>
                  <p className="text-brand-700">Total: {formatCurrency(quote.total)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Invoices</p>
              {selectedInvoices.length === 0 ? <p className="text-xs text-brand-700">No invoices yet.</p> : null}
              {selectedInvoices.map((invoice) => {
                const label = isOverdue(invoice.due_date, invoice.status) ? 'overdue' : invoice.status;
                return (
                  <div key={invoice.id} className="rounded-2xl border border-surface/80 bg-surface/75 p-3 text-xs">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="font-semibold text-brand-900">{formatInvoiceNumber(invoice.invoice_number)}</p>
                      <StatusBadge tone={label === 'paid' ? 'success' : label === 'overdue' ? 'danger' : 'warning'}>
                        {label}
                      </StatusBadge>
                    </div>
                    <p className="text-brand-700">Issue: {formatDate(invoice.issue_date)}</p>
                    <p className="text-brand-700">Due: {formatDate(invoice.due_date)}</p>
                    <p className="text-brand-700">Total: {formatCurrency(invoice.total)}</p>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Payments</p>
              {paymentRows.length === 0 ? <p className="text-xs text-brand-700">No payments recorded yet.</p> : null}
              {paymentRows.map((payment) => (
                <div
                  key={`${payment.invoice_number}-${payment.created_at}-${payment.amount}`}
                  className="rounded-2xl border border-surface/80 bg-surface/75 p-3 text-xs"
                >
                  <p className="font-semibold text-brand-900">
                    {formatInvoiceNumber(payment.invoice_number)} - {formatCurrency(payment.amount)}
                  </p>
                  <p className="text-brand-700">
                    {payment.method} | {formatDateTime(payment.created_at)}
                  </p>
                  <p className="text-brand-700">Ref: {payment.reference ?? '-'}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>
      ) : null}
    </div>
  );
}
