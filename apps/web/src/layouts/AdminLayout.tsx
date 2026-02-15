import { NavLink, Outlet } from 'react-router-dom';
import { BrandLogo } from '@/components/BrandLogo';
import { AdminBottomNav } from '@/components/AdminBottomNav';
import { useAuth } from '@/features/auth/AuthProvider';
import { cn } from '@/utils/cn';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/calendar', label: 'Calendar' },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/quotes', label: 'Quotes' },
  { to: '/admin/invoices', label: 'Invoices' },
  { to: '/admin/monthly-plans', label: 'Plans' },
  { to: '/admin/services', label: 'Services' },
  { to: '/admin/settings', label: 'Settings' },
];

export function AdminLayout(): React.JSX.Element {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen px-4 pb-28 pt-4 safe-top md:pb-6">
      <header className="sticky top-0 z-30 pb-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-3xl border border-surface/80 bg-surface/60 px-3 py-2 shadow-glass backdrop-blur-2xl">
          <BrandLogo />
          <button
            onClick={() => void signOut()}
            className="tap-target inline-flex min-h-11 items-center rounded-xl px-2 text-xs font-semibold text-brand-700"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-[220px_1fr]">
        <aside className="hidden space-y-2 md:block">
          {adminLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'tap-target flex min-h-11 items-center rounded-2xl border px-3 text-sm font-semibold transition',
                  isActive
                    ? 'border-brand-700 bg-brand-700 text-text-invert shadow-card'
                    : 'border-surface/80 bg-surface/70 text-brand-800',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </aside>
        <main>
          <Outlet />
        </main>
      </div>

      <div className="print:hidden md:hidden">
        <AdminBottomNav />
      </div>
    </div>
  );
}
