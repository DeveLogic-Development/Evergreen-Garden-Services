import { FloatingNav, NavIcons } from '@/components/ui/FloatingNav';

const icons = NavIcons();

const items = [
  { label: 'Book', to: '/book', icon: icons.book },
  { label: 'Bookings', to: '/bookings', icon: icons.bookings },
  { label: 'Quotes', to: '/quotes', icon: icons.quotes },
  { label: 'Invoices', to: '/invoices', icon: icons.invoices },
  { label: 'Profile', to: '/profile', icon: icons.profile },
];

export function BottomNav(): React.JSX.Element {
  return <FloatingNav items={items} />;
}
