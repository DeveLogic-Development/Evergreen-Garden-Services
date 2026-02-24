import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { CustomerLayout } from '@/layouts/CustomerLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { SignupPage } from '@/features/auth/SignupPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import {
  RequireAdmin,
  RequireAuth,
  RequireCustomer,
  RequireOnboardingComplete,
  RequireProfileComplete,
} from '@/features/auth/guards';
import { useAuth } from '@/features/auth/AuthProvider';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { BookPage } from '@/features/bookings/BookPage';
import { BookingsPage } from '@/features/bookings/BookingsPage';
import { QuotesPage } from '@/features/quotes/QuotesPage';
import { InvoicesPage } from '@/features/invoices/InvoicesPage';
import { QuotePrintPage } from '@/features/quotes/QuotePrintPage';
import { InvoicePrintPage } from '@/features/invoices/InvoicePrintPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { Card } from '@/components/Card';
import { hasSupabaseEnv } from '@/lib/env';
import { hasCompletedOnboarding } from '@/lib/onboarding';
import { WelcomePage } from '@/features/onboarding/WelcomePage';

const AdminRoutes = lazy(() => import('@/features/admin/AdminRoutes'));

function HomeRedirect(): React.JSX.Element {
  const { user, isAdmin, loading, isProfileComplete } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-sm text-brand-700">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasCompletedOnboarding(user.id)) {
    return <Navigate to="/welcome" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (!isProfileComplete) {
    return <Navigate to="/profile" replace />;
  }

  return <Navigate to="/bookings" replace />;
}

function AdminLazyEntry(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="p-4">
          <Card>Loading admin...</Card>
        </div>
      }
    >
      <AdminRoutes />
    </Suspense>
  );
}

function EnvWarning(): React.JSX.Element {
  if (hasSupabaseEnv) {
    return <></>;
  }

  return (
    <div className="mx-auto max-w-xl p-4">
      <Card className="border border-brand-700 bg-accent-500 text-brand-900">
        Missing `VITE_SUPABASE_URL` and Supabase key in `.env.local`.
      </Card>
    </div>
  );
}

export function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <EnvWarning />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<RequireOnboardingComplete />}>
            <Route path="/welcome" element={<WelcomePage />} />

            <Route element={<RequireCustomer />}>
              <Route element={<CustomerLayout />}>
                <Route path="/profile" element={<ProfilePage />} />
                <Route element={<RequireProfileComplete />}>
                  <Route path="/book" element={<BookPage />} />
                  <Route path="/bookings" element={<BookingsPage />} />
                  <Route path="/quotes" element={<QuotesPage />} />
                  <Route path="/quotes/:quoteId/print" element={<QuotePrintPage />} />
                  <Route path="/invoices" element={<InvoicesPage />} />
                  <Route path="/invoices/:invoiceId/print" element={<InvoicePrintPage />} />
                </Route>
              </Route>
            </Route>

            <Route element={<RequireAdmin />}>
              <Route path="/admin/*" element={<AdminLazyEntry />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
