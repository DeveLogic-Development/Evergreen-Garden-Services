import { Link } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';

const links = [
  { to: '/admin/quotes', label: 'Quotes', description: 'Create and manage customer quotes.' },
  { to: '/admin/invoices', label: 'Invoices', description: 'Track invoices and payments.' },
  { to: '/admin/monthly-plans', label: 'Monthly plans', description: 'Manage recurring plan requests and schedules.' },
  { to: '/admin/services', label: 'Services', description: 'Add and edit service offerings.' },
  { to: '/admin/settings', label: 'Settings', description: 'Business details, VAT, banking, and service areas.' },
];

export function AdminMenuPage(): React.JSX.Element {
  return (
    <div className="space-y-3">
      <header>
        <h1 className="text-2xl font-semibold text-brand-900">More</h1>
        <p className="text-sm text-brand-700">Quick access to the rest of admin tools.</p>
      </header>

      <div className="space-y-2">
        {links.map((link) => (
          <Link key={link.to} to={link.to} className="block">
            <GlassCard className="space-y-1">
              <p className="text-sm font-semibold text-brand-900">{link.label}</p>
              <p className="text-xs text-brand-700">{link.description}</p>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
