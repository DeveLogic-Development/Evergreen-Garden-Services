import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { FormInput } from '@/components/ui/Input';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { BrandLogo } from '@/components/BrandLogo';
import { requestPasswordReset, updatePassword } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';

export function ResetPasswordPage(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const { pushToast } = useToast();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setShowUpdate(true);
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setShowUpdate(true);
      }
    });
  }, []);

  const onRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      pushToast('Reset link sent to your email', 'success');
    } catch (error) {
      pushToast((error as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const onUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 8) {
      pushToast('Password must be at least 8 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      pushToast('Passwords do not match', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(newPassword);
      pushToast('Password updated. You can sign in now.', 'success');
      setShowUpdate(false);
      setNewPassword('');
      setConfirmPassword('');
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
        <div>
          <h1 className="text-2xl font-semibold text-brand-900">Reset password</h1>
          <p className="mt-1 text-sm text-brand-700">
            {showUpdate ? 'Set your new password.' : 'Send a secure reset link to your email.'}
          </p>
        </div>
      </div>

      {showUpdate ? (
        <form className="space-y-3" onSubmit={onUpdate}>
          <FormInput
            label="New password"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
          <FormInput
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
          <SecondaryButton fullWidth onClick={() => setShowPassword((value) => !value)}>
            {showPassword ? 'Hide passwords' : 'Show passwords'}
          </SecondaryButton>
          <PrimaryButton type="submit" fullWidth disabled={submitting}>
            {submitting ? 'Updating...' : 'Set new password'}
          </PrimaryButton>
        </form>
      ) : (
        <form className="space-y-3" onSubmit={onRequest}>
          <FormInput
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <PrimaryButton type="submit" fullWidth disabled={submitting}>
            {submitting ? 'Sending link...' : 'Send reset link'}
          </PrimaryButton>
        </form>
      )}

      <div className="flex items-center justify-between text-xs text-brand-700">
        <Link className="font-semibold underline" to="/login">
          Back to login
        </Link>
      </div>
    </GlassCard>
  );
}
