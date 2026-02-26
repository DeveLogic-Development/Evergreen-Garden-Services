import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormInput, FormSelect, FormTextArea } from '@/components/ui/Input';
import { PrimaryButton } from '@/components/ui/Button';
import {
  createMonthlyPlanRequest,
  getPublicSettings,
  listMyBookings,
  listMyMonthlyPlanRequests,
  listMyMonthlyPlans,
} from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { composeServiceAddress, parseServiceAddress, resolveServiceAreas } from '@/lib/serviceAreas';
import { formatCurrency, formatDate, formatDateTime, formatQuoteNumber } from '@/utils/format';

const statusTone: Record<string, 'neutral' | 'brand' | 'success' | 'warning' | 'danger'> = {
  requested: 'warning',
  confirmed: 'brand',
  completed: 'success',
  cancelled: 'danger',
};

const timeline = ['requested', 'confirmed', 'completed'];
const monthlyTone: Record<string, 'neutral' | 'brand' | 'success' | 'warning' | 'danger'> = {
  draft: 'neutral',
  quoted: 'warning',
  active: 'success',
  paused: 'brand',
  cancelled: 'danger',
  completed: 'neutral',
};
const requestTone: Record<string, 'neutral' | 'brand' | 'success' | 'warning' | 'danger'> = {
  requested: 'warning',
  contacted: 'brand',
  quoted: 'success',
  closed: 'neutral',
};

const dayName: Record<number, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

function BookingTimeline({ status }: { status: string }): React.JSX.Element {
  const activeIndex = status === 'cancelled' ? -1 : timeline.indexOf(status);

  return (
    <div className="grid grid-cols-3 gap-2">
      {timeline.map((step, index) => (
        <div key={step} className="space-y-1">
          <div className={index <= activeIndex ? 'h-1.5 rounded-full bg-brand-700' : 'h-1.5 rounded-full bg-surface/80'} />
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-700">{step}</p>
        </div>
      ))}
    </div>
  );
}

export function BookingsPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { pushToast } = useToast();
  const [view, setView] = useState<'once' | 'monthly'>('once');
  const query = useQuery({ queryKey: ['my-bookings'], queryFn: listMyBookings });
  const plansQuery = useQuery({ queryKey: ['my-monthly-plans'], queryFn: listMyMonthlyPlans });
  const requestsQuery = useQuery({ queryKey: ['my-monthly-plan-requests'], queryFn: listMyMonthlyPlanRequests });
  const settingsQuery = useQuery({ queryKey: ['settings-public'], queryFn: getPublicSettings });
  const [requestForm, setRequestForm] = useState({
    title: 'Monthly garden maintenance',
    street_address: '',
    area: '',
    preferred_start_date: '',
    frequency_per_week: '1',
    notes: '',
  });
  const serviceAreas = useMemo(
    () => resolveServiceAreas(settingsQuery.data?.service_areas),
    [settingsQuery.data?.service_areas],
  );

  useEffect(() => {
    const parsed = parseServiceAddress(profile?.address, serviceAreas);
    if (!parsed.streetAddress && !parsed.area) {
      return;
    }
    setRequestForm((current) => ({
      ...current,
      street_address: current.street_address || parsed.streetAddress,
      area: current.area || parsed.area,
    }));
  }, [profile?.address, serviceAreas]);

  const requestMutation = useMutation({
    mutationFn: async () => {
      const frequencyPerWeek = Number(requestForm.frequency_per_week);
      const title = requestForm.title.trim();
      const streetAddress = requestForm.street_address.trim();
      const area = requestForm.area.trim();
      if (!title) {
        throw new Error('Enter a request title');
      }
      if (streetAddress.length < 4) {
        throw new Error('Enter street name and number');
      }
      if (!serviceAreas.includes(area)) {
        throw new Error('Select a valid area');
      }
      if (!Number.isInteger(frequencyPerWeek) || frequencyPerWeek < 1 || frequencyPerWeek > 7) {
        throw new Error('Times per week must be between 1 and 7');
      }

      await createMonthlyPlanRequest({
        title,
        address: composeServiceAddress(streetAddress, area),
        preferred_start_date: requestForm.preferred_start_date || null,
        frequency_per_week: frequencyPerWeek,
        notes: requestForm.notes.trim() || null,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-monthly-plan-requests'] });
      setRequestForm((current) => ({
        ...current,
        preferred_start_date: '',
        frequency_per_week: '1',
        notes: '',
      }));
      pushToast('Monthly plan request sent', 'success');
    },
    onError: (error) => pushToast((error as Error).message, 'error'),
  });

  const upcomingInvoiceCount = useMemo(
    () =>
      (plansQuery.data ?? []).reduce(
        (acc, plan) => acc + (plan.monthly_plan_invoices?.filter((invoice) => invoice.invoices?.status !== 'paid').length ?? 0),
        0,
      ),
    [plansQuery.data],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-brand-900">My bookings</h1>
          <p className="text-sm text-brand-700">Track updates from request to completion.</p>
        </div>
        <Link
          to="/book"
          className="tap-target inline-flex min-h-11 items-center rounded-2xl border border-brand-700 bg-brand-700 px-3 text-xs font-semibold text-text-invert"
        >
          Create booking
        </Link>
      </div>

      <div className="glass-panel flex rounded-2xl p-1">
        <button
          onClick={() => setView('once')}
          className={
            view === 'once'
              ? 'tap-target min-h-11 flex-1 rounded-xl bg-brand-700 px-3 text-xs font-semibold text-text-invert'
              : 'tap-target min-h-11 flex-1 rounded-xl px-3 text-xs font-semibold text-brand-700'
          }
        >
          Once-off bookings
        </button>
        <button
          onClick={() => setView('monthly')}
          className={
            view === 'monthly'
              ? 'tap-target min-h-11 flex-1 rounded-xl bg-brand-700 px-3 text-xs font-semibold text-text-invert'
              : 'tap-target min-h-11 flex-1 rounded-xl px-3 text-xs font-semibold text-brand-700'
          }
        >
          Monthly plans
        </button>
      </div>

      {view === 'once' && query.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : null}

      {view === 'once' && (query.data ?? []).map((booking) => (
        <GlassCard key={booking.id} className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-brand-900">{booking.services?.name ?? 'Service'}</p>
              <p className="text-xs text-brand-700">Requested {formatDateTime(booking.requested_datetime)}</p>
            </div>
            <StatusBadge tone={statusTone[booking.status] ?? 'neutral'}>{booking.status}</StatusBadge>
          </div>

          <p className="text-sm text-brand-800">{booking.address}</p>
          {booking.notes ? <p className="text-xs text-brand-700">{booking.notes}</p> : null}
          {booking.confirmed_datetime ? (
            <p className="text-xs font-semibold text-brand-800">
              Confirmed for {formatDateTime(booking.confirmed_datetime)}
            </p>
          ) : null}

          <BookingTimeline status={booking.status} />

          <div className="grid grid-cols-2 gap-2">
            <a
              href="mailto:hello@evergreen.local?subject=Reschedule booking request"
              className="tap-target inline-flex min-h-11 items-center justify-center rounded-2xl border border-surface/80 bg-surface/70 px-3 text-xs font-semibold text-brand-800"
            >
              Request reschedule
            </a>
            <a
              href="tel:+27000000000"
              className="tap-target inline-flex min-h-11 items-center justify-center rounded-2xl border border-accent-600 bg-accent-500/85 px-3 text-xs font-semibold text-brand-900"
            >
              Need help?
            </a>
          </div>
        </GlassCard>
      ))}

      {view === 'once' && !query.isLoading && (query.data ?? []).length === 0 ? (
        <div className="space-y-2">
          <EmptyState
            title="No bookings yet"
            description="Start your first request and we will confirm availability."
          />
          <Link
            to="/book"
            className="tap-target inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-brand-700 bg-brand-700 px-3 text-sm font-semibold text-text-invert"
          >
            Create booking
          </Link>
        </div>
      ) : null}

      {view === 'monthly' ? (
        <>
          {plansQuery.isLoading || requestsQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : null}

          <GlassCard className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-brand-900">Request a monthly plan</p>
              <p className="text-xs text-brand-700">
                Send your preferred details and the admin team will contact you to confirm schedule and quote.
              </p>
            </div>

            <FormInput
              label="Request title"
              value={requestForm.title}
              onChange={(event) => setRequestForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Monthly garden maintenance"
            />

            <div className="grid gap-2 md:grid-cols-2">
              <FormInput
                label="Street name and number"
                value={requestForm.street_address}
                onChange={(event) =>
                  setRequestForm((current) => ({ ...current, street_address: event.target.value }))
                }
                placeholder="12 Main Road"
              />
              <FormSelect
                label="Area"
                value={requestForm.area}
                onChange={(event) => setRequestForm((current) => ({ ...current, area: event.target.value }))}
                hint={settingsQuery.isLoading ? 'Loading service areas...' : undefined}
              >
                <option value="">Select your area</option>
                {serviceAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <FormInput
                label="Preferred start date"
                type="date"
                value={requestForm.preferred_start_date}
                onChange={(event) =>
                  setRequestForm((current) => ({ ...current, preferred_start_date: event.target.value }))
                }
              />
              <FormInput
                label="Times per week"
                type="number"
                min={1}
                max={7}
                value={requestForm.frequency_per_week}
                onChange={(event) =>
                  setRequestForm((current) => ({ ...current, frequency_per_week: event.target.value }))
                }
              />
            </div>

            <FormTextArea
              label="Notes"
              rows={3}
              value={requestForm.notes}
              onChange={(event) => setRequestForm((current) => ({ ...current, notes: event.target.value }))}
              hint="Share preferred days, gate details, or any special requests."
            />

            <PrimaryButton
              fullWidth
              onClick={() => requestMutation.mutate()}
              disabled={requestMutation.isPending}
            >
              {requestMutation.isPending ? 'Sending request...' : 'Send monthly plan request'}
            </PrimaryButton>
          </GlassCard>

          {(requestsQuery.data ?? []).map((request) => (
            <GlassCard key={request.id} className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-brand-900">{request.title}</p>
                  <p className="text-xs text-brand-700">Submitted {formatDate(request.created_at)}</p>
                </div>
                <StatusBadge tone={requestTone[request.status] ?? 'neutral'}>{request.status}</StatusBadge>
              </div>
              <p className="text-sm text-brand-800">{request.address}</p>
              <p className="text-xs text-brand-700">Requested frequency: {request.frequency_per_week} time(s) per week</p>
              {request.preferred_start_date ? (
                <p className="text-xs text-brand-700">Preferred start: {formatDate(request.preferred_start_date)}</p>
              ) : null}
              {request.notes ? <p className="text-xs text-brand-700">Your note: {request.notes}</p> : null}
              {request.admin_notes ? (
                <p className="text-xs font-semibold text-brand-800">Admin note: {request.admin_notes}</p>
              ) : null}
            </GlassCard>
          ))}

          {upcomingInvoiceCount > 0 ? (
            <GlassCard className="border border-accent-600 bg-accent-500/85">
              <p className="text-sm font-semibold text-brand-900">
                {upcomingInvoiceCount} monthly invoice(s) awaiting payment
              </p>
              <p className="text-xs text-brand-700">Upload EFT proof in Invoices after payment.</p>
            </GlassCard>
          ) : null}

          {(plansQuery.data ?? []).map((plan) => (
            <GlassCard key={plan.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-brand-900">{plan.title}</p>
                  <p className="text-xs text-brand-700">
                    Start {formatDate(plan.start_date)}
                    {plan.end_date ? ` | End ${formatDate(plan.end_date)}` : ''}
                  </p>
                  {plan.quotes ? (
                    <p className="text-xs text-brand-700">
                      Quote {formatQuoteNumber(plan.quotes.quote_number)} total {formatCurrency(plan.quotes.total)}
                    </p>
                  ) : null}
                </div>
                <StatusBadge tone={monthlyTone[plan.status] ?? 'neutral'}>{plan.status}</StatusBadge>
              </div>

              <p className="text-sm text-brand-800">{plan.address}</p>

              <div className="space-y-2">
                {(plan.monthly_plan_schedule ?? []).map((slot) => (
                  <div key={slot.id} className="rounded-2xl border border-surface/75 bg-surface/75 p-3 text-xs">
                    <p className="font-semibold text-brand-900">{slot.services?.name ?? 'Service'}</p>
                    <p className="text-brand-700">
                      {dayName[slot.day_of_week] ?? slot.day_of_week} at {slot.start_time.slice(0, 5)} for{' '}
                      {slot.duration_minutes} min
                    </p>
                    <p className="text-brand-700">Rate {formatCurrency(slot.unit_price)} per visit</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}

          {!plansQuery.isLoading && (plansQuery.data ?? []).length === 0 ? (
            <EmptyState
              title="No monthly plans yet"
              description="Send a request above. Once your quote is accepted, your monthly schedule will appear here."
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
