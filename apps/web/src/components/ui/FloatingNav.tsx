import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
};

type FloatingNavProps = {
  items: NavItem[];
};

export function FloatingNav({ items }: FloatingNavProps): React.JSX.Element {
  const columns = Math.max(items.length, 1);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 safe-bottom">
      <div className="mx-auto max-w-xl rounded-[28px] border border-surface/70 bg-surface/60 px-2 py-2 shadow-glass backdrop-blur-2xl">
        <ul
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'tap-target flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-[10px] font-semibold leading-tight transition',
                    isActive
                      ? 'bg-brand-700 text-text-invert shadow-card'
                      : 'text-brand-800 hover:bg-surface/70',
                  )
                }
              >
                <span className="h-4 w-4">{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export function NavIcons(): Record<'book' | 'bookings' | 'quotes' | 'invoices' | 'profile', React.JSX.Element> {
  const cls = 'h-4 w-4 stroke-current';
  return {
    book: (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <path d="M4 19h16M5 19V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v11" strokeWidth="1.8" />
        <path d="M9 13h6M9 10h4" strokeWidth="1.8" />
      </svg>
    ),
    bookings: (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <path d="M7 4v3M17 4v3M4 10h16M5 7h14a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" strokeWidth="1.8" />
      </svg>
    ),
    quotes: (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <path d="M6 4h9l3 3v13H6z" strokeWidth="1.8" />
        <path d="M9 11h6M9 15h6" strokeWidth="1.8" />
      </svg>
    ),
    invoices: (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <path d="M7 3h10l2 2v16l-3-2-3 2-3-2-3 2V5z" strokeWidth="1.8" />
        <path d="M9 9h6M9 13h6" strokeWidth="1.8" />
      </svg>
    ),
    profile: (
      <svg viewBox="0 0 24 24" fill="none" className={cls}>
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" strokeWidth="1.8" />
        <path d="M5 20a7 7 0 0 1 14 0" strokeWidth="1.8" />
      </svg>
    ),
  };
}
