import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { BookingCreateSchema } from '@evergreen/shared';
import { GlassCard } from '@/components/ui/GlassCard';
import { FormInput, FormSelect, FormTextArea } from '@/components/ui/Input';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { createBooking, fetchServices, getPublicSettings } from '@/lib/api';
import { sendWebEmailNotification } from '@/lib/emailNotifications';
import { useToast } from '@/components/Toast';
import { formatDateTime } from '@/utils/format';
import { useAuth } from '@/features/auth/AuthProvider';
import { composeServiceAddress, parseServiceAddress, resolveServiceAreas } from '@/lib/serviceAreas';

const schema = BookingCreateSchema.omit({ address: true }).extend({
  requested_datetime_local: z.string().min(1),
  street_address: z.string().min(4, 'Enter street name and number'),
  area: z.string().min(1, 'Select an area'),
});

const steps = ['Service', 'Schedule', 'Address', 'Review'];

export function BookPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: fetchServices });
  const settingsQuery = useQuery({ queryKey: ['settings-public'], queryFn: getPublicSettings });

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    service_id: '',
    requested_datetime_local: '',
    street_address: '',
    area: '',
    notes: '',
    photos: [] as File[],
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

    setForm((current) => ({
      ...current,
      street_address: current.street_address || parsed.streetAddress,
      area: current.area || parsed.area,
    }));
  }, [profile?.address, serviceAreas]);

  const selectedService = useMemo(
    () => (servicesQuery.data ?? []).find((service) => String(service.id) === form.service_id),
    [servicesQuery.data, form.service_id],
  );

  const minDateTime = useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({
        service_id: Number(form.service_id),
        requested_datetime: new Date(form.requested_datetime_local).toISOString(),
        requested_datetime_local: form.requested_datetime_local,
        street_address: form.street_address,
        area: form.area,
        notes: form.notes || undefined,
      });

      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Invalid booking data');
      }
      if (!serviceAreas.includes(parsed.data.area)) {
        throw new Error('Select an area from the list');
      }

      await createBooking({
        service_id: parsed.data.service_id,
        requested_datetime: parsed.data.requested_datetime,
        address: composeServiceAddress(parsed.data.street_address, parsed.data.area),
        notes: parsed.data.notes,
      });
    },
    onSuccess: async () => {
      void sendWebEmailNotification({
        type: 'booking_created',
        title: 'New booking request submitted',
        summary: `${profile?.full_name ?? 'Customer'} requested ${selectedService?.name ?? 'a service'}`,
        details: {
          customer_name: profile?.full_name ?? 'Unknown',
          customer_phone: profile?.phone ?? '',
          service: selectedService?.name ?? '',
          requested_datetime: form.requested_datetime_local || '',
          address: form.street_address && form.area ? composeServiceAddress(form.street_address, form.area) : '',
          notes: form.notes || '',
        },
      });
      await queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      setForm({
        service_id: '',
        requested_datetime_local: '',
        street_address: '',
        area: '',
        notes: '',
        photos: [],
      });
      setStep(0);
      pushToast('Booking request submitted', 'success');
      navigate('/bookings', { replace: true });
    },
    onError: (error) => {
      pushToast((error as Error).message, 'error');
    },
  });

  const canProceed = [
    Boolean(form.service_id),
    Boolean(form.requested_datetime_local),
    Boolean(form.street_address.trim().length > 3 && form.area),
    true,
  ][step];

  return (
    <div className="space-y-3 pb-32">
      <GlassCard className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">New booking</p>
          <h1 className="text-2xl font-semibold text-brand-900">Garden visit request</h1>
          <p className="mt-1 text-sm text-brand-700">A simple 4-step flow inspired by travel checkout.</p>
        </div>

        <Stepper steps={steps} current={step} />

        {step === 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-brand-900">Choose service</p>
            {servicesQuery.isLoading ? <p className="text-sm text-brand-700">Loading services...</p> : null}
            {!servicesQuery.isLoading && (servicesQuery.data ?? []).length === 0 ? (
              <p className="rounded-2xl border border-accent-600 bg-accent-500/80 p-3 text-sm text-brand-900">
                No services available yet. Please ask admin to add active services.
              </p>
            ) : null}
            {(servicesQuery.data ?? []).map((service) => {
              const selected = String(service.id) === form.service_id;
              return (
                <button
                  key={service.id}
                  onClick={() => setForm((current) => ({ ...current, service_id: String(service.id) }))}
                  className={selected
                    ? 'tap-target flex min-h-11 w-full items-center justify-between rounded-2xl border border-brand-700 bg-brand-700/90 px-3 py-3 text-left text-text-invert'
                    : 'tap-target flex min-h-11 w-full items-center justify-between rounded-2xl border border-surface/80 bg-surface/70 px-3 py-3 text-left text-brand-900'}
                >
                  <span className="text-sm font-semibold">{service.name}</span>
                  <span className="text-xs">{service.default_duration_minutes} min</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {step === 1 ? (
          <FormInput
            label="Preferred date and time"
            type="datetime-local"
            min={minDateTime}
            value={form.requested_datetime_local}
            onChange={(event) =>
              setForm((current) => ({ ...current, requested_datetime_local: event.target.value }))
            }
            required
          />
        ) : null}

        {step === 2 ? (
          <div className="space-y-3">
            <FormInput
              label="Street name and number"
              value={form.street_address}
              onChange={(event) =>
                setForm((current) => ({ ...current, street_address: event.target.value }))
              }
              placeholder="12 Main Road"
              required
            />
            <FormSelect
              label="Area"
              value={form.area}
              onChange={(event) => setForm((current) => ({ ...current, area: event.target.value }))}
              hint={settingsQuery.isLoading ? 'Loading service areas...' : undefined}
              required
            >
              <option value="">Select your area</option>
              {serviceAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </FormSelect>
            <FormTextArea
              label="Extra notes"
              rows={3}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              hint="Optional details to help your gardener arrive prepared."
            />
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                Photos (optional)
              </span>
              <input
                className="tap-target min-h-11 w-full rounded-2xl border border-surface/80 bg-surface/80 px-3 py-2 text-sm"
                type="file"
                accept="image/*"
                multiple
                onChange={(event) =>
                  setForm((current) => ({ ...current, photos: Array.from(event.target.files ?? []) }))
                }
              />
              {form.photos.length > 0 ? (
                <p className="text-xs text-brand-700">{form.photos.length} photo(s) selected.</p>
              ) : null}
            </label>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-3 text-sm">
            <div className="rounded-2xl border border-surface/80 bg-surface/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Review</p>
              <p className="mt-2 font-semibold text-brand-900">{selectedService?.name ?? 'No service selected'}</p>
              <p className="text-brand-700">
                {form.requested_datetime_local
                  ? formatDateTime(new Date(form.requested_datetime_local))
                  : 'No date selected'}
              </p>
              <p className="mt-2 whitespace-pre-line text-brand-800">
                {form.street_address && form.area
                  ? composeServiceAddress(form.street_address, form.area)
                  : 'No address'}
              </p>
              {form.notes ? <p className="mt-2 text-brand-700">Note: {form.notes}</p> : null}
            </div>
            <div className="rounded-2xl border border-accent-600 bg-accent-500/85 p-3 text-brand-900">
              We will confirm availability and respond with next steps as soon as possible.
            </div>
          </div>
        ) : null}
      </GlassCard>

      <div className="bottom-nav-clearance fixed inset-x-0 z-[60] px-4 pb-3">
        <div className="mx-auto flex w-full max-w-xl gap-2 rounded-3xl border border-surface/75 bg-surface/65 p-2 shadow-glass backdrop-blur-2xl">
          <SecondaryButton fullWidth onClick={() => setStep((current) => Math.max(current - 1, 0))}>
            Back
          </SecondaryButton>
          {step < steps.length - 1 ? (
            <PrimaryButton
              fullWidth
              disabled={!canProceed}
              onClick={() => setStep((current) => Math.min(current + 1, steps.length - 1))}
            >
              Next
            </PrimaryButton>
          ) : (
            <PrimaryButton fullWidth onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Submitting...' : 'Submit booking'}
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
}
