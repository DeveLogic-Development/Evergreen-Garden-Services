import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { hasCompletedOnboarding } from '@/lib/onboarding';

function FullScreenLoader(): React.JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center text-sm text-brand-700">
      Loading...
    </div>
  );
}

export function RequireAuth(): React.JSX.Element {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function RequireProfileComplete(): React.JSX.Element {
  const { isProfileComplete, loading, user } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isProfileComplete) {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
}

export function RequireAdmin(): React.JSX.Element {
  const { loading, isAdmin, user } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/bookings" replace />;
  }

  return <Outlet />;
}

export function RequireCustomer(): React.JSX.Element {
  const { loading, isAdmin, user } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}

export function RequireOnboardingComplete(): React.JSX.Element {
  const { loading, user, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const completed = hasCompletedOnboarding(user.id);
  const isWelcomeRoute = location.pathname === '/welcome';

  if (!completed && !isWelcomeRoute) {
    return <Navigate to="/welcome" replace />;
  }

  if (completed && isWelcomeRoute) {
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/bookings'} replace />;
  }

  return <Outlet />;
}
