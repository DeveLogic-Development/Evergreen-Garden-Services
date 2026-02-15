import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { BrandLogo } from '@/components/BrandLogo';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { hasCompletedOnboarding, setOnboardingComplete } from '@/lib/onboarding';
import { useAuth } from '@/features/auth/AuthProvider';

const slides = [
  {
    title: 'Book in under a minute',
    description: 'Choose a service, pick a preferred slot, and send your request in a few taps.',
  },
  {
    title: 'Quotes and invoices in one place',
    description: 'Track updates, approve quotes, and manage payments from your phone.',
  },
  {
    title: 'Stay in control',
    description: 'Get clear status updates from booking request to completed service.',
  },
];

function LeafArt(): React.JSX.Element {
  return (
    <div className="relative h-48 overflow-hidden rounded-[28px] border border-surface/80 bg-brand-900/20">
      <div className="absolute -left-8 -top-10 h-40 w-40 rounded-full bg-brand-400/70 blur-2xl" />
      <div className="absolute right-0 top-3 h-36 w-36 rounded-full bg-accent-500/80 blur-2xl" />
      <div className="absolute -bottom-8 left-1/4 h-40 w-40 rounded-full bg-brand-500/70 blur-2xl" />
      <svg viewBox="0 0 220 120" className="absolute inset-0 h-full w-full p-4 text-brand-900">
        <path
          d="M40 88C55 58 90 40 124 38C116 64 82 96 46 98"
          className="fill-none stroke-current"
          strokeWidth="4"
        />
        <path
          d="M130 30C150 26 174 36 190 58C168 67 144 56 131 38"
          className="fill-none stroke-current"
          strokeWidth="4"
        />
        <path
          d="M74 98L92 67M147 62L165 80"
          className="fill-none stroke-current"
          strokeWidth="3"
        />
      </svg>
    </div>
  );
}

export function WelcomePage(): React.JSX.Element {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (hasCompletedOnboarding(user.id)) {
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/bookings'} replace />;
  }

  const isLast = index === slides.length - 1;
  const active = slides[index] ?? slides[0];
  if (!active) {
    return <></>;
  }

  const completeAndStart = () => {
    setOnboardingComplete(user.id, true);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen px-4 pb-6 pt-6 safe-top">
      <div className="mx-auto flex min-h-[88vh] w-full max-w-md flex-col justify-between">
        <header className="flex items-center justify-between">
          <BrandLogo />
          <button className="tap-target text-xs font-semibold uppercase tracking-wide text-brand-700" onClick={completeAndStart}>
            Skip
          </button>
        </header>

        <GlassCard className="space-y-5">
          <LeafArt />
          <div>
            <p className="text-2xl font-semibold text-brand-900">{active.title}</p>
            <p className="mt-2 text-sm leading-6 text-brand-700">{active.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {slides.map((slide, dotIndex) => (
              <div
                key={slide.title}
                className={dotIndex === index ? 'h-2 w-6 rounded-full bg-brand-700' : 'h-2 w-2 rounded-full bg-brand-300'}
              />
            ))}
          </div>
        </GlassCard>

        <div className="glass-panel space-y-2 rounded-3xl p-3">
          {isLast ? (
            <PrimaryButton fullWidth onClick={completeAndStart}>
              Start booking
            </PrimaryButton>
          ) : (
            <PrimaryButton fullWidth onClick={() => setIndex((current) => Math.min(current + 1, slides.length - 1))}>
              Continue
            </PrimaryButton>
          )}
          <SecondaryButton fullWidth onClick={() => setIndex((current) => Math.max(current - 1, 0))}>
            Back
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
