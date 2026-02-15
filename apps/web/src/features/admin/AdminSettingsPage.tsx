import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GlassCard } from '@/components/ui/GlassCard';
import { FormInput, FormTextArea } from '@/components/ui/Input';
import { PrimaryButton } from '@/components/ui/Button';
import { getSettings, updateSettings } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { DEFAULT_SERVICE_AREAS, resolveServiceAreas } from '@/lib/serviceAreas';

export function AdminSettingsPage(): React.JSX.Element {
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin-settings'], queryFn: getSettings });

  const [form, setForm] = useState({
    business_name: '',
    reg_number: '',
    vat_registered: true,
    vat_number: '',
    vat_rate: '0.15',
    address: '',
    banking_details: '',
    service_areas: resolveServiceAreas(undefined),
  });
  const [newArea, setNewArea] = useState('');

  useEffect(() => {
    if (query.data) {
      setForm({
        business_name: query.data.business_name,
        reg_number: query.data.reg_number ?? '',
        vat_registered: query.data.vat_registered,
        vat_number: query.data.vat_number ?? '',
        vat_rate: String(query.data.vat_rate),
        address: query.data.address,
        banking_details: query.data.banking_details,
        service_areas: resolveServiceAreas(query.data.service_areas),
      });
    }
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: async () => {
      await updateSettings({
        business_name: form.business_name,
        reg_number: form.reg_number || null,
        vat_registered: form.vat_registered,
        vat_number: form.vat_number || null,
        vat_rate: Number(form.vat_rate),
        address: form.address,
        banking_details: form.banking_details,
        service_areas: resolveServiceAreas(form.service_areas),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      pushToast('Settings updated', 'success');
    },
    onError: (error) => pushToast((error as Error).message, 'error'),
  });

  const onAddArea = () => {
    const area = newArea.trim();
    if (!area) {
      return;
    }

    const exists = form.service_areas.some((item) => item.toLowerCase() === area.toLowerCase());
    if (exists) {
      pushToast('Area already exists', 'error');
      return;
    }

    setForm((current) => ({ ...current, service_areas: [...current.service_areas, area] }));
    setNewArea('');
  };

  const onRemoveArea = (area: string) => {
    const isDefaultArea = DEFAULT_SERVICE_AREAS.some((item) => item.toLowerCase() === area.toLowerCase());
    if (isDefaultArea) {
      return;
    }

    setForm((current) => ({
      ...current,
      service_areas: current.service_areas.filter((item) => item !== area),
    }));
  };

  return (
    <div className="space-y-3">
      <header>
        <h1 className="text-2xl font-semibold text-brand-900">Business settings</h1>
        <p className="text-sm text-brand-700">Control VAT, company identity, and payment details.</p>
      </header>

      <GlassCard className="space-y-3">
        <FormInput
          label="Business name"
          value={form.business_name}
          onChange={(event) => setForm((current) => ({ ...current, business_name: event.target.value }))}
        />
        <FormInput
          label="Registration number"
          value={form.reg_number}
          onChange={(event) => setForm((current) => ({ ...current, reg_number: event.target.value }))}
        />
        <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-surface/80 bg-surface/75 px-3 text-sm text-brand-900">
          <input
            type="checkbox"
            checked={form.vat_registered}
            onChange={(event) => setForm((current) => ({ ...current, vat_registered: event.target.checked }))}
          />
          VAT registered
        </label>
        <div className="grid gap-2 md:grid-cols-2">
          <FormInput
            label="VAT number"
            value={form.vat_number}
            onChange={(event) => setForm((current) => ({ ...current, vat_number: event.target.value }))}
          />
          <FormInput
            label="VAT rate"
            type="number"
            step="0.01"
            value={form.vat_rate}
            onChange={(event) => setForm((current) => ({ ...current, vat_rate: event.target.value }))}
          />
        </div>
        <FormTextArea
          label="Business address"
          rows={3}
          value={form.address}
          onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
        />
        <FormTextArea
          label="Banking details"
          rows={4}
          value={form.banking_details}
          onChange={(event) => setForm((current) => ({ ...current, banking_details: event.target.value }))}
        />

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Allowed service areas</p>
          <p className="text-xs text-brand-700">
            Default areas remain available. Add extra areas here when your service range grows.
          </p>
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <FormInput
              label="New area"
              value={newArea}
              onChange={(event) => setNewArea(event.target.value)}
              placeholder="Example: Herolds Bay"
            />
            <button
              type="button"
              className="tap-target mt-auto inline-flex min-h-11 items-center justify-center rounded-2xl border border-brand-700 bg-brand-700 px-4 text-sm font-semibold text-text-invert"
              onClick={onAddArea}
            >
              Add area
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.service_areas.map((area) => {
              const isDefaultArea = DEFAULT_SERVICE_AREAS.some(
                (item) => item.toLowerCase() === area.toLowerCase(),
              );
              return (
                <div
                  key={area}
                  className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-surface/80 bg-surface/75 px-3 text-xs font-semibold text-brand-900"
                >
                  <span>{area}</span>
                  {!isDefaultArea ? (
                    <button
                      type="button"
                      className="tap-target inline-flex min-h-8 items-center rounded-xl px-2 text-brand-700"
                      onClick={() => onRemoveArea(area)}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <PrimaryButton fullWidth onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : 'Save settings'}
        </PrimaryButton>
      </GlassCard>
    </div>
  );
}
