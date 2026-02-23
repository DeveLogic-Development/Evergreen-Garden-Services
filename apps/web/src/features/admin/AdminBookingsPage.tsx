import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Booking, BookingStatus } from '@/types/db';
import { GlassCard } from '@/components/ui/GlassCard';
import { AppButton, PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { adminUpdateBooking, listAllBookings, sendBookingConfirmationToCustomer } from '@/lib/api';
import { formatDateTime } from '@/utils/format';
import { useToast } from '@/components/Toast';

const statusOptions: BookingStatus[] = ['requested', 'confirmed', 'completed', 'cancelled'];

export function AdminBookingsPage(): React.JSX.Element {
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [drafts, setDrafts] = useState<Record<string, { status: BookingStatus; confirmed_datetime: string }>>({});

  const query = useQuery({
    queryKey: ['admin-bookings', statusFilter, fromDate, toDate],
    queryFn: () =>
      listAllBookings({
        status: statusFilter,
        ...(fromDate ? { from: fromDate } : {}),
        ...(toDate ? { to: toDate } : {}),
      }),
  });

  const mutation = useMutation({
    mutationFn: async ({
      bookingId,
      booking,
      draft,
    }: {
      bookingId: string;
      booking: Booking;
      draft: { status: BookingStatus; confirmed_datetime: string };
    }) => {
      const nextConfirmedIso = draft.confirmed_datetime ? new Date(draft.confirmed_datetime).toISOString() : null;
      await adminUpdateBooking(bookingId, {
        status: draft.status,
        confirmed_datetime: nextConfirmedIso,
      });

      const shouldSendConfirmation =
        draft.status === 'confirmed' &&
        (booking.status !== 'confirmed' || (booking.confirmed_datetime ?? null) !== nextConfirmedIso);

      if (!shouldSendConfirmation) {
        return { confirmationEmail: null as { emailed: boolean; message?: string } | null };
      }

      const confirmationEmail = await sendBookingConfirmationToCustomer(bookingId);
      return { confirmationEmail };
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      if (result.confirmationEmail?.emailed) {
        pushToast('Booking updated and confirmation emailed to customer', 'success');
        return;
      }
      if (result.confirmationEmail && !result.confirmationEmail.emailed) {
        pushToast(result.confirmationEmail.message ?? 'Booking updated, but confirmation email failed', 'info');
        return;
      }
      pushToast('Booking updated', 'success');
    },
    onError: (error) => {
      pushToast((error as Error).message, 'error');
    },
  });

  const rows = useMemo(() => query.data ?? [], [query.data]);

  const getDraft = (booking: Booking) =>
    drafts[booking.id] ?? {
      status: booking.status,
      confirmed_datetime: booking.confirmed_datetime
        ? new Date(booking.confirmed_datetime).toISOString().slice(0, 16)
        : '',
    };

  return (
    <div className="space-y-3">
      <header className="flex items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-brand-900">Bookings</h1>
          <p className="text-sm text-brand-700">Manage requests, confirmations, and completions.</p>
        </div>
        <AppButton variant="secondary" onClick={() => setFiltersOpen(true)}>
          Filters
        </AppButton>
      </header>

      {query.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : null}

      <GlassCard className="hidden overflow-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-brand-700">
            <tr>
              <th className="px-2 py-2">Customer</th>
              <th className="px-2 py-2">Service</th>
              <th className="px-2 py-2">Requested</th>
              <th className="px-2 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((booking) => (
              <tr key={booking.id} className="border-t border-surface/80">
                <td className="px-2 py-2">{booking.profiles?.full_name ?? '-'}</td>
                <td className="px-2 py-2">{booking.services?.name ?? '-'}</td>
                <td className="px-2 py-2">{formatDateTime(booking.requested_datetime)}</td>
                <td className="px-2 py-2">{booking.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <div className="space-y-3">
        {rows.map((booking) => {
          const draft = getDraft(booking);
          return (
            <GlassCard key={booking.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-brand-900">{booking.profiles?.full_name ?? 'Customer'}</p>
                  <p className="text-xs text-brand-700">{booking.profiles?.phone ?? '-'}</p>
                  <p className="text-[11px] text-brand-700/80">Customer notifications use the account email from signup.</p>
                  <p className="text-xs text-brand-700">{booking.services?.name ?? 'Service'}</p>
                  <p className="text-xs text-brand-700">{formatDateTime(booking.requested_datetime)}</p>
                </div>
                <StatusBadge
                  tone={
                    booking.status === 'cancelled'
                      ? 'danger'
                      : booking.status === 'completed'
                        ? 'success'
                        : booking.status === 'confirmed'
                          ? 'brand'
                          : 'warning'
                  }
                >
                  {booking.status}
                </StatusBadge>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">Status</span>
                  <select
                    className="tap-target min-h-11 w-full rounded-2xl border border-surface/80 bg-surface/75 px-3 text-sm"
                    value={draft.status}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [booking.id]: {
                          ...draft,
                          status: event.target.value as BookingStatus,
                        },
                      }))
                    }
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">Confirmed at</span>
                  <input
                    type="datetime-local"
                    className="tap-target min-h-11 w-full rounded-2xl border border-surface/80 bg-surface/75 px-3 text-sm"
                    value={draft.confirmed_datetime}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [booking.id]: {
                          ...draft,
                          confirmed_datetime: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <PrimaryButton
                  fullWidth
                  onClick={() => mutation.mutate({ bookingId: booking.id, booking, draft })}
                  disabled={mutation.isPending}
                >
                  Save booking
                </PrimaryButton>
                <Link
                  to={`/admin/quotes?bookingId=${booking.id}`}
                  className="tap-target inline-flex min-h-11 items-center justify-center rounded-2xl border border-surface/80 bg-surface/75 px-3 text-sm font-semibold text-brand-800"
                >
                  Create quote
                </Link>
                <Link
                  to={`/admin/invoices?bookingId=${booking.id}&customerId=${booking.customer_id}`}
                  className="tap-target inline-flex min-h-11 items-center justify-center rounded-2xl border border-surface/80 bg-surface/75 px-3 text-sm font-semibold text-brand-800"
                >
                  Create invoice
                </Link>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <BottomSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filter bookings">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">Status</span>
          <select
            className="tap-target min-h-11 w-full rounded-2xl border border-surface/80 bg-surface/75 px-3 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as BookingStatus | 'all')}
          >
            <option value="all">All</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">From date</span>
          <input
            type="date"
            className="tap-target min-h-11 w-full rounded-2xl border border-surface/80 bg-surface/75 px-3 text-sm"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">To date</span>
          <input
            type="date"
            className="tap-target min-h-11 w-full rounded-2xl border border-surface/80 bg-surface/75 px-3 text-sm"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <SecondaryButton
            fullWidth
            onClick={() => {
              setStatusFilter('all');
              setFromDate('');
              setToDate('');
            }}
          >
            Clear
          </SecondaryButton>
          <PrimaryButton fullWidth onClick={() => setFiltersOpen(false)}>
            Apply
          </PrimaryButton>
        </div>
      </BottomSheet>
    </div>
  );
}
