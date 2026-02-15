import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { GlassCard } from '@/components/ui/GlassCard';
import { FormInput } from '@/components/ui/Input';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { BrandLogo } from '@/components/BrandLogo';
import { signUp } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase';
import { hasCompletedOnboarding, setOnboardingComplete } from '@/lib/onboarding';

const schema = z
  .object({
    email: z.string().email('Use a valid email address'),
    password: z.string().min(8, 'Use at least 8 characters'),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export function SignupPage(): React.JSX.Element {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  if (user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = schema.safeParse(form);

    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof typeof form, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof typeof form;
        nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const result = await signUp(form.email, form.password);
      pushToast('Account created. Complete your profile next.', 'success');
      if (result.hasSession) {
        const {
          data: { user: signedInUser },
        } = await supabase.auth.getUser();
        if (signedInUser && !hasCompletedOnboarding(signedInUser.id)) {
          setOnboardingComplete(signedInUser.id, true);
        }
        navigate('/bookings', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } catch (error) {
      pushToast((error as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GlassCard className="my-2 flex min-h-[calc(100%-40px)] flex-1 flex-col justify-center space-y-2">
      <div className="space-y-3">
        <BrandLogo showText={false} size="xl" className="justify-center" />
        <div className="glass-panel flex rounded-2xl p-1">
          <Link
            className="tap-target inline-flex min-h-11 flex-1 items-center justify-center rounded-xl text-xs font-semibold text-brand-700"
            to="/login"
          >
            Login
          </Link>
          <Link
            className="tap-target inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-brand-700 text-xs font-semibold text-text-invert"
            to="/signup"
          >
            Create account
          </Link>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-brand-900">Create your account</h1>
          <p className="mt-1 text-sm text-brand-700">You will set up your profile before placing your first booking.</p>
        </div>
      </div>

      <form className="space-y-3" onSubmit={onSubmit}>
        <FormInput
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          error={errors.email}
          required
        />
        <FormInput
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          error={errors.password}
          required
        />
        <FormInput
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          value={form.confirmPassword}
          onChange={(event) =>
            setForm((current) => ({ ...current, confirmPassword: event.target.value }))
          }
          error={errors.confirmPassword}
          required
        />
        <SecondaryButton fullWidth onClick={() => setShowPassword((value) => !value)}>
          {showPassword ? 'Hide passwords' : 'Show passwords'}
        </SecondaryButton>
        <PrimaryButton type="submit" fullWidth disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </PrimaryButton>
      </form>
    </GlassCard>
  );
}
