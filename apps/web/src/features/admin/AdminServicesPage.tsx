import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/Badge';
import { FormInput } from '@/components/ui/Input';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { createService, listAdminServices, updateService } from '@/lib/api';
import { useToast } from '@/components/Toast';

const createServiceSchema = z.object({
  name: z.string().min(2, 'Service name is required'),
  default_duration_minutes: z.number().int().min(15, 'Duration must be at least 15 minutes'),
});

export function AdminServicesPage(): React.JSX.Element {
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin-services'], queryFn: listAdminServices });

  const [name, setName] = useState('');
  const [duration, setDuration] = useState('120');
  const [active, setActive] = useState(true);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-services'] }),
      queryClient.invalidateQueries({ queryKey: ['services'] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const parsed = createServiceSchema.safeParse({
        name: name.trim(),
        default_duration_minutes: Number(duration),
      });

      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Invalid service details');
      }

      await createService({
        name: parsed.data.name,
        default_duration_minutes: parsed.data.default_duration_minutes,
        active,
      });
    },
    onSuccess: async () => {
      setName('');
      setDuration('120');
      setActive(true);
      await refresh();
      pushToast('Service added', 'success');
    },
    onError: (error) => pushToast((error as Error).message, 'error'),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ serviceId, nextActive }: { serviceId: number; nextActive: boolean }) => {
      await updateService(serviceId, { active: nextActive });
    },
    onSuccess: async () => {
      await refresh();
      pushToast('Service updated', 'success');
    },
    onError: (error) => pushToast((error as Error).message, 'error'),
  });

  return (
    <div className="space-y-3">
      <header>
        <h1 className="text-2xl font-semibold text-brand-900">Services</h1>
        <p className="text-sm text-brand-700">Manage the services clients can choose during booking.</p>
      </header>

      <GlassCard className="space-y-3">
        <p className="text-sm font-semibold text-brand-900">Add service</p>
        <FormInput
          label="Service name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="General Garden Maintenance"
        />
        <FormInput
          label="Default duration (minutes)"
          type="number"
          min={15}
          step={15}
          value={duration}
          onChange={(event) => setDuration(event.target.value)}
        />
        <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-surface/80 bg-surface/75 px-3 text-sm text-brand-900">
          <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
          Active for clients
        </label>

        <PrimaryButton fullWidth onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Adding...' : 'Add service'}
        </PrimaryButton>
      </GlassCard>

      {(query.data ?? []).map((service) => (
        <GlassCard key={service.id} className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-brand-900">{service.name}</p>
              <p className="text-xs text-brand-700">{service.default_duration_minutes} minutes</p>
            </div>
            <StatusBadge tone={service.active ? 'success' : 'neutral'}>
              {service.active ? 'active' : 'inactive'}
            </StatusBadge>
          </div>
          <SecondaryButton
            fullWidth
            onClick={() => toggleMutation.mutate({ serviceId: service.id, nextActive: !service.active })}
            disabled={toggleMutation.isPending}
          >
            {service.active ? 'Deactivate service' : 'Activate service'}
          </SecondaryButton>
        </GlassCard>
      ))}
    </div>
  );
}
