import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { GlassCard } from '@/components/ui/GlassCard';
import { FormInput, FormSelect } from '@/components/ui/Input';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { useAuth } from '@/features/auth/AuthProvider';
import { getPublicSettings, upsertProfile } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { composeServiceAddress, parseServiceAddress, resolveServiceAreas } from '@/lib/serviceAreas';

const schema = z.object({
  full_name: z.string().min(2, 'Enter your full name'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  street_address: z.string().min(4, 'Enter street name and number'),
  area: z.string().min(1, 'Select an area'),
});

const steps = ['Basic info', 'Address', 'Confirm'];

export function ProfilePage(): React.JSX.Element {
  const { profile, refreshProfile } = useAuth();
  const settingsQuery = useQuery({ queryKey: ['settings-public'], queryFn: getPublicSettings });
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<
    Partial<Record<'full_name' | 'phone' | 'street_address' | 'area', string>>
  >({});
  const [form, setForm] = useState({ full_name: '', phone: '', street_address: '', area: '' });
  const serviceAreas = useMemo(
    () => resolveServiceAreas(settingsQuery.data?.service_areas),
    [settingsQuery.data?.service_areas],
  );

  useEffect(() => {
    if (profile) {
      const { streetAddress, area } = parseServiceAddress(profile.address, serviceAreas);
      setForm({
        full_name: profile.full_name ?? '',
        phone: profile.phone ?? '',
        street_address: streetAddress,
        area,
      });
    }
  }, [profile, serviceAreas]);

  const parsed = useMemo(() => schema.safeParse(form), [form]);

  const onSubmit = async () => {
    const validation = schema.safeParse(form);
    if (!validation.success) {
      const nextErrors: Partial<Record<'full_name' | 'phone' | 'street_address' | 'area', string>> = {};
      for (const issue of validation.error.issues) {
        const key = issue.path[0] as 'full_name' | 'phone' | 'street_address' | 'area';
        nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      const firstError = validation.error.issues[0]?.path[0];
      setStep(firstError === 'street_address' || firstError === 'area' ? 1 : 0);
      return;
    }

    if (!serviceAreas.includes(validation.data.area)) {
      setErrors({ area: 'Select an area from the list' });
      setStep(1);
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      await upsertProfile({
        full_name: form.full_name,
        phone: form.phone,
        address: composeServiceAddress(form.street_address, form.area),
      });
      await refreshProfile();
      pushToast('Profile setup complete', 'success');
      navigate('/bookings', { replace: true });
    } catch (error) {
      pushToast((error as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 pb-32">
      <GlassCard className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-brand-900">Profile setup</h1>
          <p className="text-sm text-brand-700">Complete this once before booking your first service.</p>
        </div>

        <Stepper steps={steps} current={step} />

        {step === 0 ? (
          <div className="space-y-3">
            <FormInput
              label="Full name"
              value={form.full_name}
              onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
              error={errors.full_name}
              required
            />
            <FormInput
              label="Phone"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              error={errors.phone}
              required
            />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-3">
            <FormInput
              label="Street name and number"
              value={form.street_address}
              onChange={(event) =>
                setForm((current) => ({ ...current, street_address: event.target.value }))
              }
              error={errors.street_address}
              placeholder="12 Main Road"
              required
            />
            <FormSelect
              label="Area"
              value={form.area}
              onChange={(event) => setForm((current) => ({ ...current, area: event.target.value }))}
              error={errors.area}
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
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-surface/75 bg-surface/70 p-3 text-sm">
              <p className="font-semibold text-brand-900">Check your details</p>
              <p className="mt-2 text-brand-800">{form.full_name}</p>
              <p className="text-brand-800">{form.phone}</p>
              <p className="mt-1 whitespace-pre-line text-brand-800">
                {form.street_address && form.area
                  ? composeServiceAddress(form.street_address, form.area)
                  : 'Complete address details'}
              </p>
            </div>
            {!parsed.success ? (
              <p className="text-xs font-semibold text-brand-700">Complete all details to continue.</p>
            ) : null}
          </div>
        ) : null}
      </GlassCard>

      <div className="bottom-nav-clearance fixed inset-x-0 z-[60] px-4">
        <div className="mx-auto flex w-full max-w-xl gap-2 rounded-3xl border border-surface/75 bg-surface/65 p-2 shadow-glass backdrop-blur-2xl">
          <SecondaryButton fullWidth onClick={() => setStep((current) => Math.max(current - 1, 0))}>
            Back
          </SecondaryButton>
          {step < steps.length - 1 ? (
            <PrimaryButton fullWidth onClick={() => setStep((current) => Math.min(current + 1, steps.length - 1))}>
              Continue
            </PrimaryButton>
          ) : (
            <PrimaryButton fullWidth onClick={() => void onSubmit()} disabled={submitting || !parsed.success}>
              {submitting ? 'Saving...' : 'Finish setup'}
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
}
