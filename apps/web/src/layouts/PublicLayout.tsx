import { Outlet, useLocation } from 'react-router-dom';
import { BrandLogo } from '@/components/BrandLogo';

export function PublicLayout(): React.JSX.Element {
  const location = useLocation();
  const isAuthFullscreen =
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/reset-password';
  const hideHeader = isAuthFullscreen;

  return (
    <div className={isAuthFullscreen ? 'min-h-dvh px-4 pb-0 pt-0 safe-top' : 'min-h-screen px-4 pb-6 pt-5 safe-top'}>
      <div className={isAuthFullscreen ? 'mx-auto flex min-h-dvh w-full max-w-md flex-col' : 'mx-auto w-full max-w-md space-y-4'}>
        {!hideHeader ? (
          <header className="glass-panel flex items-center justify-between rounded-3xl p-3">
            <BrandLogo />
          </header>
        ) : null}
        <Outlet />
      </div>
    </div>
  );
}
