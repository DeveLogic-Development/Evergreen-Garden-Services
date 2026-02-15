import { Link, Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { BrandLogo } from '@/components/BrandLogo';
import { useAuth } from '@/features/auth/AuthProvider';

export function CustomerLayout(): React.JSX.Element {
  const { signOut, profile } = useAuth();
  const location = useLocation();

  const isProfileRoute = location.pathname === '/profile';

  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-30 px-4 pb-3 pt-3 safe-top print:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between rounded-3xl border border-surface/75 bg-surface/60 px-3 py-2 shadow-glass backdrop-blur-2xl">
          <BrandLogo showText={false} />
          <div className="flex items-center gap-2">
            {profile?.full_name ? (
              <p className="max-w-28 truncate text-[11px] font-semibold text-brand-800">{profile.full_name}</p>
            ) : null}
            <button
              onClick={() => void signOut()}
              className="tap-target inline-flex min-h-11 items-center rounded-xl px-2 text-xs font-semibold text-brand-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl space-y-3 px-4">
        {!isProfileRoute ? (
          <Link
            to="/profile"
            className="tap-target inline-flex min-h-11 items-center rounded-2xl border border-surface/75 bg-surface/65 px-3 text-xs font-semibold text-brand-700 print:hidden"
          >
            Profile setup
          </Link>
        ) : null}
        <Outlet />
      </main>

      <div className="print:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
