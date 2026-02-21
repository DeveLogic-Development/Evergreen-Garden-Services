import { useEffect, useState } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { Container } from '@/components/ui/Container';
import { appLinks } from '@/lib/app-links';
import { navItems } from '@/data/content';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';

type HeaderProps = {
  activeSection: string;
};

export function Header({ activeSection }: HeaderProps): React.JSX.Element {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useLockBodyScroll(menuOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-safe pt-safe-top">
      <Container>
        <div
          className={[
            'mt-3 flex items-center justify-between rounded-2xl border px-3 py-2 transition duration-300',
            scrolled
              ? 'border-surface/70 bg-surface/68 shadow-[0_14px_30px_rgb(var(--color-brand-900-rgb)/0.18)] backdrop-blur-xl'
              : 'border-transparent bg-surface/35 backdrop-blur-md',
          ].join(' ')}
        >
          <a href="#home" className="inline-flex items-center">
            <BrandLogo compactOnMobile />
          </a>

          <nav className="hidden items-center gap-5 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={[
                  'text-sm font-medium transition',
                  activeSection === item.id ? 'text-brand-600' : 'text-brand-800 hover:text-brand-600',
                ].join(' ')}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={appLinks.signin}
              className="tap-target inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-700 bg-brand-700 px-4 text-sm font-semibold text-text-invert transition hover:bg-brand-600"
            >
              Sign in
            </a>

            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="tap-target inline-flex min-h-11 w-11 items-center justify-center rounded-xl border border-surface/75 bg-surface/62 text-brand-800 lg:hidden"
              aria-expanded={menuOpen}
              aria-label="Toggle menu"
            >
              <span className="relative h-4 w-5">
                <span className={['absolute left-0 top-0 h-0.5 w-5 bg-current transition', menuOpen ? 'translate-y-[7px] rotate-45' : ''].join(' ')} />
                <span className={['absolute left-0 top-[7px] h-0.5 w-5 bg-current transition', menuOpen ? 'opacity-0' : 'opacity-100'].join(' ')} />
                <span className={['absolute left-0 top-[14px] h-0.5 w-5 bg-current transition', menuOpen ? '-translate-y-[7px] -rotate-45' : ''].join(' ')} />
              </span>
            </button>
          </div>
        </div>
      </Container>

      <div
        className={[
          'fixed inset-0 z-40 bg-brand-900/42 transition lg:hidden',
          menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={() => setMenuOpen(false)}
      />

      <aside
        className={[
          'fixed right-0 top-0 z-50 h-[100dvh] min-h-[100svh] w-[82vw] max-w-sm overflow-y-auto border-l border-surface/70 bg-bg p-5 pb-safe-bottom pt-safe-top shadow-[0_18px_36px_rgb(var(--color-brand-900-rgb)/0.2)] transition lg:hidden',
          menuOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <BrandLogo />
        <nav className="mt-7 grid gap-2">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setMenuOpen(false)}
              className={[
                'tap-target inline-flex min-h-11 items-center rounded-xl border px-3 text-sm font-medium',
                activeSection === item.id
                  ? 'border-brand-600 bg-brand-600 text-text-invert'
                  : 'border-surface/75 bg-surface/66 text-brand-800',
              ].join(' ')}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
    </header>
  );
}
