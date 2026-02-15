import { FloatingNav } from '@/components/ui/FloatingNav';

const iconClass = 'h-4 w-4 stroke-current';

const items = [
  {
    label: 'Dashboard',
    to: '/admin/dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClass}>
        <path d="M4 13h7V4H4zm9 7h7V11h-7zm0-9h7V4h-7zM4 20h7v-5H4z" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    label: 'Calendar',
    to: '/admin/calendar',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClass}>
        <path d="M7 4v3M17 4v3M4 10h16M5 7h14a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    label: 'Bookings',
    to: '/admin/bookings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClass}>
        <path d="M7 4v3M17 4v3M4 10h16M5 7h14a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    label: 'Customers',
    to: '/admin/customers',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClass}>
        <path d="M16 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM8 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" strokeWidth="1.8" />
        <path d="M2.5 20a5.5 5.5 0 0 1 11 0M12.5 20a5.5 5.5 0 0 1 9 0" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    label: 'More',
    to: '/admin/menu',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClass}>
        <circle cx="5" cy="12" r="1.5" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="1.5" strokeWidth="1.8" />
        <circle cx="19" cy="12" r="1.5" strokeWidth="1.8" />
      </svg>
    ),
  },
];

export function AdminBottomNav(): React.JSX.Element {
  return <FloatingNav items={items} />;
}
