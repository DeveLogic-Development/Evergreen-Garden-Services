import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Booking } from '@/types/db';
import { GlassCard } from '@/components/ui/GlassCard';
import { AppButton } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { listAllBookings } from '@/lib/api';
import { formatDate, formatDateTime } from '@/utils/format';

const monthFormatter = new Intl.DateTimeFormat('en-ZA', { month: 'long', year: 'numeric' });
const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Johannesburg',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const timeFormatter = new Intl.DateTimeFormat('en-ZA', {
  timeZone: 'Africa/Johannesburg',
  hour: '2-digit',
  minute: '2-digit',
});

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const statusTone: Record<string, 'neutral' | 'brand' | 'success' | 'warning' | 'danger'> = {
  requested: 'warning',
  confirmed: 'brand',
  completed: 'success',
  cancelled: 'danger',
};

function toDateKey(value: string): string {
  return dateKeyFormatter.format(new Date(value));
}

function toTime(value: string): string {
  return timeFormatter.format(new Date(value));
}

export function AdminCalendarPage(): React.JSX.Element {
  const [monthCursor, setMonthCursor] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState('');
  const [dayPanelOpen, setDayPanelOpen] = useState(false);

  const monthStart = useMemo(
    () => new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1, 0, 0, 0, 0),
    [monthCursor],
  );
  const monthEnd = useMemo(
    () => new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0, 23, 59, 59, 999),
    [monthCursor],
  );

  const query = useQuery({
    queryKey: ['admin-bookings-calendar', monthStart.toISOString(), monthEnd.toISOString()],
    queryFn: () =>
      listAllBookings({
        status: 'all',
        from: monthStart.toISOString(),
        to: monthEnd.toISOString(),
      }),
  });

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const booking of query.data ?? []) {
      const slot = booking.confirmed_datetime ?? booking.requested_datetime;
      const key = toDateKey(slot);
      const existing = map.get(key) ?? [];
      map.set(key, [...existing, booking]);
    }

    for (const [key, rows] of map.entries()) {
      rows.sort((a, b) => {
        const aSlot = a.confirmed_datetime ?? a.requested_datetime;
        const bSlot = b.confirmed_datetime ?? b.requested_datetime;
        return new Date(aSlot).getTime() - new Date(bSlot).getTime();
      });
      map.set(key, rows);
    }
    return map;
  }, [query.data]);

  useEffect(() => {
    if (selectedDate) {
      return;
    }
    const key = dateKeyFormatter.format(monthStart);
    setSelectedDate(key);
  }, [monthStart, selectedDate]);

  useEffect(() => {
    const firstKey = dateKeyFormatter.format(monthStart);
    const lastKey = dateKeyFormatter.format(monthEnd);
    if (!selectedDate || selectedDate < firstKey || selectedDate > lastKey) {
      setSelectedDate(firstKey);
    }
  }, [monthStart, monthEnd, selectedDate]);

  const firstWeekday = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();
  const selectedRows = bookingsByDate.get(selectedDate) ?? [];

  const renderBookings = (rows: Booking[]) => {
    if (rows.length === 0) {
      return <p className="text-sm text-brand-700">No bookings for this day.</p>;
    }

    return rows.map((booking) => {
      const slot = booking.confirmed_datetime ?? booking.requested_datetime;
      return (
        <div key={booking.id} className="rounded-2xl border border-surface/80 bg-surface/75 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-brand-900">{booking.profiles?.full_name ?? 'Customer'}</p>
              <p className="text-xs text-brand-700">{booking.services?.name ?? 'Service'}</p>
              <p className="text-xs text-brand-700">
                {toTime(slot)} | {formatDateTime(slot)}
              </p>
            </div>
            <StatusBadge tone={statusTone[booking.status] ?? 'neutral'}>{booking.status}</StatusBadge>
          </div>
          <p className="mt-1 text-xs text-brand-700">{booking.address}</p>
        </div>
      );
    });
  };

  return (
    <div className="space-y-3">
      <header className="flex items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-brand-900">Calendar</h1>
          <p className="text-sm text-brand-700">View booking load by day and time.</p>
        </div>
        <Link
          to="/admin/bookings"
          className="tap-target inline-flex min-h-11 items-center rounded-2xl border border-surface/80 bg-surface/75 px-3 text-xs font-semibold text-brand-800"
        >
          Open bookings
        </Link>
      </header>

      <GlassCard className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <AppButton
            variant="secondary"
            onClick={() =>
              setMonthCursor(
                (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
              )
            }
          >
            Prev
          </AppButton>
          <p className="text-sm font-semibold text-brand-900">{monthFormatter.format(monthStart)}</p>
          <AppButton
            variant="secondary"
            onClick={() =>
              setMonthCursor(
                (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
              )
            }
          >
            Next
          </AppButton>
        </div>

        {query.isLoading ? <Skeleton className="h-72" /> : null}

        {!query.isLoading ? (
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-1">
              {dayLabels.map((label) => (
                <p key={label} className="text-center text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                  {label}
                </p>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstWeekday }).map((_, index) => (
                <div key={`empty-${index}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const key = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const count = bookingsByDate.get(key)?.length ?? 0;
                const active = selectedDate === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedDate(key);
                      setDayPanelOpen(true);
                    }}
                    className={
                      active
                        ? 'tap-target min-h-14 rounded-2xl border border-brand-700 bg-brand-700 p-2 text-left text-text-invert'
                        : 'tap-target min-h-14 rounded-2xl border border-surface/80 bg-surface/70 p-2 text-left text-brand-900'
                    }
                  >
                    <p className="text-sm font-semibold">{day}</p>
                    <p className={active ? 'text-[10px] text-text-invert/90' : 'text-[10px] text-brand-700'}>
                      {count} booking{count === 1 ? '' : 's'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </GlassCard>

      <GlassCard className="space-y-2">
        <p className="text-sm font-semibold text-brand-900">
          {selectedDate ? `Bookings for ${formatDate(selectedDate)}` : 'Bookings'}
        </p>
        <p className="text-xs text-brand-700">
          Tap a date to open the day panel with all bookings.
        </p>
        <AppButton
          variant="secondary"
          onClick={() => setDayPanelOpen(true)}
          disabled={!selectedDate}
        >
          Open day bookings
        </AppButton>
      </GlassCard>

      <BottomSheet
        open={dayPanelOpen}
        onClose={() => setDayPanelOpen(false)}
        title={selectedDate ? `Bookings for ${formatDate(selectedDate)}` : 'Bookings'}
      >
        {renderBookings(selectedRows)}
      </BottomSheet>
    </div>
  );
}
