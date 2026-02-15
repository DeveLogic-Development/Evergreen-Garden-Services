import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { FormInput } from '@/components/ui/Input';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { BrandLogo } from '@/components/BrandLogo';
import { useAuth } from './AuthProvider';
import { signIn } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import { hasCompletedOnboarding, setOnboardingComplete } from '@/lib/onboarding';

export function LoginPage(): React.JSX.Element {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { pushToast } = useToast();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email, password);
      const {
        data: { user: signedInUser },
      } = await supabase.auth.getUser();
      if (signedInUser && !hasCompletedOnboarding(signedInUser.id)) {
        setOnboardingComplete(signedInUser.id, true);
      }
      pushToast('Welcome back', 'success');
      navigate('/bookings', { replace: true });
    } catch (error) {
      pushToast((error as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GlassCard className="my-5 flex min-h-[calc(100%-40px)] flex-1 flex-col justify-center space-y-3">
      <div className="space-y-3">
        <BrandLogo showText={false} size="xl" className="justify-center" />
        <div className="glass-panel flex rounded-2xl p-1">
          <Link
            className="tap-target inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-brand-700 text-xs font-semibold text-text-invert"
            to="/login"
          >
            Login
          </Link>
          <Link
            className="tap-target inline-flex min-h-11 flex-1 items-center justify-center rounded-xl text-xs font-semibold text-brand-700"
            to="/signup"
          >
            Create account
          </Link>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-brand-900">Welcome back</h1>
          <p className="mt-1 text-sm text-brand-700">Track bookings, quotes, and invoices in one place.</p>
        </div>
      </div>

      <form className="space-y-3" onSubmit={onSubmit}>
        <FormInput
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <FormInput
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <SecondaryButton fullWidth onClick={() => setShowPassword((value) => !value)}>
          {showPassword ? 'Hide password' : 'Show password'}
        </SecondaryButton>
        <PrimaryButton type="submit" fullWidth disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </PrimaryButton>
      </form>

      <div className="flex items-center justify-between text-xs text-brand-700">
        <Link className="font-semibold underline" to="/reset-password">
          Forgot password?
        </Link>
      </div>
    </GlassCard>
  );
}
