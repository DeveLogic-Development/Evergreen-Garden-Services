import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/Badge';
import { FormInput } from '@/components/ui/Input';
import { AppButton, PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import {
  adminUpdateMonthlyPlanRequest,
  createMonthlyPlanWithQuote,
  generateMonthlyPlanBookings,
  generateMonthlyPlanInvoices,
  listAdminServices,
  listAllMonthlyPlanRequests,
  listAllMonthlyPlans,
  listProfiles,
  setMonthlyPlanStatus,
} from '@/lib/api';
import { useToast } from '@/components/Toast';
import { formatCurrency, formatDate, formatQuoteNumber } from '@/utils/format';

type ScheduleRow = {
  service_id: string;
  day_of_week: string;
  start_time: string;
  duration_minutes: string;
  unit_price: string;
};

const dayOptions = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

const statusToneMap: Record<string, 'neutral' | 'brand' | 'success' | 'warning' | 'danger'> = {
  draft: 'neutral',
  quoted: 'warning',
  active: 'success',
  paused: 'brand',
  cancelled: 'danger',
  completed: 'neutral',
};
const requestStatusToneMap: Record<string, 'neutral' | 'brand' | 'success' | 'warning' | 'danger'> = {
  requested: 'warning',
  contacted: 'brand',
  quoted: 'success',
  closed: 'neutral',
};

const emptyScheduleRow = (): ScheduleRow => ({
  service_id: '',
  day_of_week: '1',
  start_time: '09:00',
  duration_minutes: '120',
  unit_price: '0',
});

export function AdminMonthlyPlansPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const plansQuery = useQuery({ queryKey: ['admin-monthly-plans'], queryFn: listAllMonthlyPlans });
  const requestsQuery = useQuery({ queryKey: ['admin-monthly-plan-requests'], queryFn: listAllMonthlyPlanRequests });
  const profilesQuery = useQuery({ queryKey: ['admin-profiles'], queryFn: listProfiles });
  const servicesQuery = useQuery({ queryKey: ['admin-services'], queryFn: listAdminServices });

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [vatRate, setVatRate] = useState('0.15');
  const [schedule, setSchedule] = useState<ScheduleRow[]>([emptyScheduleRow()]);

  useEffect(() => {
    const today = new Date();
    const start = today.toISOString().slice(0, 10);
    if (!startDate) {
      setStartDate(start);
    }
    if (!validUntil) {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      setValidUntil(nextWeek.toISOString().slice(0, 10));
    }
  }, [startDate, validUntil]);

  useEffect(() => {
    if (!customerId) {
      return;
    }
    const profile = (profilesQuery.data ?? []).find((row) => row.id === customerId);
    if (!profile) {
      return;
    }
    if (!title) {
      setTitle(`${profile.full_name ?? 'Customer'} monthly plan`);
    }
    if (!address && profile.address) {
      setAddress(profile.address);
    }
  }, [customerId, profilesQuery.data, title, address]);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-monthly-plans'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-monthly-plan-requests'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-bookings-all'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-quotes'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] }),
      queryClient.invalidateQueries({ queryKey: ['my-invoices'] }),
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!customerId) {
        throw new Error('Select a customer');
      }
      if (!title.trim()) {
        throw new Error('Enter plan title');
      }
      if (!address.trim()) {
        throw new Error('Enter service address');
      }
      if (!startDate || !validUntil) {
        throw new Error('Start date and quote validity are required');
      }

      const parsedSchedule = schedule.map((row) => ({
        service_id: Number(row.service_id),
        day_of_week: Number(row.day_of_week),
        start_time: row.start_time,
        duration_minutes: Number(row.duration_minutes),
        unit_price: Number(row.unit_price),
      }));

      if (parsedSchedule.some((row) => !Number.isFinite(row.service_id) || row.service_id <= 0)) {
        throw new Error('Select a service for each schedule slot');
      }
      if (parsedSchedule.some((row) => !row.start_time)) {
        throw new Error('Select a time for each schedule slot');
      }
      if (parsedSchedule.some((row) => row.day_of_week < 0 || row.day_of_week > 6)) {
        throw new Error('Invalid day of week in schedule');
      }
      if (parsedSchedule.some((row) => row.duration_minutes <= 0)) {
        throw new Error('Duration must be greater than zero');
      }
      if (parsedSchedule.some((row) => row.unit_price < 0)) {
        throw new Error('Unit price must be greater than or equal to zero');
      }

      const planId = await createMonthlyPlanWithQuote({
        customer_id: customerId,
        title: title.trim(),
        address: address.trim(),
        start_date: startDate,
        end_date: endDate || null,
        valid_until: validUntil,
        vat_rate: Number(vatRate),
        schedule: parsedSchedule,
      });

      return planId;
    },
    onSuccess: async (planId) => {
      if (selectedRequestId) {
        await adminUpdateMonthlyPlanRequest(selectedRequestId, {
          status: 'quoted',
          quoted_plan_id: planId,
        });
      }
      await refresh();
      setSelectedRequestId(null);
      setCustomerId('');
      setTitle('');
      setAddress('');
      setEndDate('');
      setSchedule([emptyScheduleRow()]);
      pushToast('Monthly plan quote created', 'success');
    },
    onError: (error) => pushToast((error as Error).message, 'error'),
  });

  const requestStatusMutation = useMutation({
    mutationFn: async ({
      requestId,
      status,
    }: {
      requestId: string;
      status: 'contacted' | 'quoted' | 'closed';
    }) => {
      await adminUpdateMonthlyPlanRequest(requestId, {
        status,
        contacted_at: status === 'contacted' ? new Date().toISOString() : null,
      });
    },
    onSuccess: async () => {
      await refresh();
      pushToast('Request updated', 'success');
    },
    onError: (error) => pushToast((error as Error).message, 'error'),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ planId, status }: { planId: string; status: 'active' | 'paused' | 'cancelled' | 'completed' }) => {
      await setMonthlyPlanStatus(planId, status);
    },
    onSuccess: async () => {
      await refresh();
      pushToast('Plan status updated', 'success');
    },
    onError: (error) => pushToast((error as Error).message, 'error'),
  });

  const generateBookingsMutation = useMutation({
    mutationFn: async (planId: string) => generateMonthlyPlanBookings(planId),
    onSuccess: async (count) => {
      await refresh();
      pushToast(`Generated ${count} booking(s) for this month`, 'success');
    },
    onError: (error) => pushToast((error as Error).message, 'error'),
  });

  const generateInvoicesMutation = useMutation({
    mutationFn: async () => generateMonthlyPlanInvoices(),
    onSuccess: async (count) => {
      await refresh();
      pushToast(`Generated ${count} monthly invoice(s)`, 'success');
    },
    onError: (error) => pushToast((error as Error).message, 'error'),
  });

  const activeServices = useMemo(() => (servicesQuery.data ?? []).filter((service) => service.active), [servicesQuery.data]);

  const applyRequestToQuoteForm = (requestId: string): void => {
    const request = (requestsQuery.data ?? []).find((row) => row.id === requestId);
    if (!request) {
      return;
    }
    setSelectedRequestId(request.id);
    setCustomerId(request.customer_id);
    setTitle(request.title);
    setAddress(request.address);
    if (request.preferred_start_date) {
      setStartDate(request.preferred_start_date);
    }
  };

  return (
    <div className="space-y-3 pb-20">
      <header>
        <h1 className="text-2xl font-semibold text-brand-900">Monthly plans</h1>
        <p className="text-sm text-brand-700">
          Build fixed weekly schedules, send a quote, and auto-run bookings once approved.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-700">Client requests</h2>
        {(requestsQuery.data ?? []).map((request) => (
          <GlassCard key={request.id} className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-brand-900">{request.title}</p>
                <p className="text-xs text-brand-700">
                  {request.profiles?.full_name ?? 'Customer'} | {request.profiles?.phone ?? 'No phone'}
                </p>
                <p className="text-xs text-brand-700">Requested {formatDate(request.created_at)}</p>
              </div>
              <StatusBadge tone={requestStatusToneMap[request.status] ?? 'neutral'}>{request.status}</StatusBadge>
            </div>

            <p className="text-sm text-brand-800">{request.address}</p>
            <p className="text-xs text-brand-700">
              Preferred start: {request.preferred_start_date ? formatDate(request.preferred_start_date) : 'Not specified'}
            </p>
            <p className="text-xs text-brand-700">Frequency: {request.frequency_per_week} time(s) per week</p>
            {request.notes ? <p className="text-xs text-brand-700">Client note: {request.notes}</p> : null}
            {request.admin_notes ? <p className="text-xs text-brand-700">Admin note: {request.admin_notes}</p> : null}

            <div className="grid grid-cols-2 gap-2">
              <SecondaryButton fullWidth onClick={() => applyRequestToQuoteForm(request.id)}>
                Prepare quote
              </SecondaryButton>
              <SecondaryButton
                fullWidth
                onClick={() => requestStatusMutation.mutate({ requestId: request.id, status: 'contacted' })}
                disabled={requestStatusMutation.isPending}
              >
                Mark contacted
              </SecondaryButton>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <AppButton
                variant="ghost"
                className="w-full"
                onClick={() => requestStatusMutation.mutate({ requestId: request.id, status: 'quoted' })}
                disabled={requestStatusMutation.isPending}
              >
                Mark quoted
              </AppButton>
              <AppButton
                variant="ghost"
                className="w-full"
                onClick={() => requestStatusMutation.mutate({ requestId: request.id, status: 'closed' })}
                disabled={requestStatusMutation.isPending}
              >
                Close request
              </AppButton>
            </div>
          </GlassCard>
        ))}
        {(requestsQuery.data ?? []).length === 0 ? (
          <GlassCard>
            <p className="text-sm text-brand-700">No monthly plan requests yet.</p>
          </GlassCard>
        ) : null}
      </section>

      <GlassCard className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-base font-semibold text-brand-900">Create monthly plan quote</p>
            {selectedRequestId ? <p className="text-xs text-brand-700">Request linked to this quote</p> : null}
          </div>
          <AppButton variant="secondary" onClick={() => generateInvoicesMutation.mutate()} disabled={generateInvoicesMutation.isPending}>
            {generateInvoicesMutation.isPending ? 'Generating...' : 'Run month-end invoices'}
          </AppButton>
        </div>

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

        <FormInput label="Plan title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <FormInput label="Service address" value={address} onChange={(event) => setAddress(event.target.value)} />

        <div className="grid gap-2 md:grid-cols-2">
          <FormInput label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <FormInput label="End date (optional)" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <FormInput
            label="Quote valid until"
            type="date"
            value={validUntil}
            onChange={(event) => setValidUntil(event.target.value)}
          />
          <FormInput label="VAT rate" type="number" step="0.01" value={vatRate} onChange={(event) => setVatRate(event.target.value)} />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Fixed weekly schedule</p>
          {schedule.map((row, index) => (
            <div key={index} className="grid gap-2 rounded-2xl border border-surface/80 bg-surface/75 p-3 md:grid-cols-5">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">Service</span>
                <select
                  className="tap-target min-h-11 w-full rounded-2xl border border-surface/80 bg-surface/80 px-3 text-sm"
                  value={row.service_id}
                  onChange={(event) =>
                    setSchedule((current) => {
                      const next = [...current];
                      const item = next[index] ?? emptyScheduleRow();
                      next[index] = { ...item, service_id: event.target.value };
                      return next;
                    })
                  }
                >
                  <option value="">Select service</option>
                  {activeServices.map((service) => (
                    <option key={service.id} value={String(service.id)}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">Day</span>
                <select
                  className="tap-target min-h-11 w-full rounded-2xl border border-surface/80 bg-surface/80 px-3 text-sm"
                  value={row.day_of_week}
                  onChange={(event) =>
                    setSchedule((current) => {
                      const next = [...current];
                      const item = next[index] ?? emptyScheduleRow();
                      next[index] = { ...item, day_of_week: event.target.value };
                      return next;
                    })
                  }
                >
                  {dayOptions.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </label>

              <FormInput
                label="Time"
                type="time"
                value={row.start_time}
                onChange={(event) =>
                  setSchedule((current) => {
                    const next = [...current];
                    const item = next[index] ?? emptyScheduleRow();
                    next[index] = { ...item, start_time: event.target.value };
                    return next;
                  })
                }
              />

              <FormInput
                label="Duration (min)"
                type="number"
                min={30}
                step={30}
                value={row.duration_minutes}
                onChange={(event) =>
                  setSchedule((current) => {
                    const next = [...current];
                    const item = next[index] ?? emptyScheduleRow();
                    next[index] = { ...item, duration_minutes: event.target.value };
                    return next;
                  })
                }
              />

              <FormInput
                label="Price per visit"
                type="number"
                min={0}
                step="0.01"
                value={row.unit_price}
                onChange={(event) =>
                  setSchedule((current) => {
                    const next = [...current];
                    const item = next[index] ?? emptyScheduleRow();
                    next[index] = { ...item, unit_price: event.target.value };
                    return next;
                  })
                }
              />
            </div>
          ))}

          <div className="flex gap-2">
            <SecondaryButton onClick={() => setSchedule((current) => [...current, emptyScheduleRow()])}>
              Add slot
            </SecondaryButton>
            <AppButton
              variant="ghost"
              onClick={() => setSchedule((current) => (current.length > 1 ? current.slice(0, -1) : current))}
            >
              Remove slot
            </AppButton>
          </div>
        </div>

        <PrimaryButton fullWidth onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create monthly plan quote'}
        </PrimaryButton>
      </GlassCard>

      <section className="space-y-3">
        {(plansQuery.data ?? []).map((plan) => (
          <GlassCard key={plan.id} className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-brand-900">{plan.title}</p>
                <p className="text-xs text-brand-700">
                  {plan.profiles?.full_name ?? 'Customer'} | Start {formatDate(plan.start_date)}
                </p>
                <p className="text-xs text-brand-700">{plan.address}</p>
                {plan.quotes ? (
                  <p className="text-xs text-brand-700">
                    Quote {formatQuoteNumber(plan.quotes.quote_number)} ({formatCurrency(plan.quotes.total)})
                  </p>
                ) : null}
              </div>
              <StatusBadge tone={statusToneMap[plan.status] ?? 'neutral'}>{plan.status}</StatusBadge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <SecondaryButton
                fullWidth
                onClick={() => generateBookingsMutation.mutate(plan.id)}
                disabled={generateBookingsMutation.isPending}
              >
                Generate this month bookings
              </SecondaryButton>
              <SecondaryButton
                fullWidth
                onClick={() => statusMutation.mutate({ planId: plan.id, status: plan.status === 'active' ? 'paused' : 'active' })}
                disabled={statusMutation.isPending || plan.status === 'cancelled' || plan.status === 'completed'}
              >
                {plan.status === 'active' ? 'Pause plan' : 'Activate plan'}
              </SecondaryButton>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <AppButton
                variant="ghost"
                className="w-full"
                onClick={() => statusMutation.mutate({ planId: plan.id, status: 'completed' })}
                disabled={statusMutation.isPending || plan.status === 'completed' || plan.status === 'cancelled'}
              >
                Mark completed
              </AppButton>
              <AppButton
                variant="ghost"
                className="w-full"
                onClick={() => statusMutation.mutate({ planId: plan.id, status: 'cancelled' })}
                disabled={statusMutation.isPending || plan.status === 'cancelled'}
              >
                Cancel plan
              </AppButton>
            </div>
          </GlassCard>
        ))}
      </section>
    </div>
  );
}
