import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { DashboardPage } from './DashboardPage';
import { AdminCustomersPage } from './AdminCustomersPage';
import { AdminBookingsPage } from './AdminBookingsPage';
import { AdminQuotesPage } from './AdminQuotesPage';
import { AdminInvoicesPage } from './AdminInvoicesPage';
import { AdminSettingsPage } from './AdminSettingsPage';
import { AdminServicesPage } from './AdminServicesPage';
import { AdminMonthlyPlansPage } from './AdminMonthlyPlansPage';
import { AdminCalendarPage } from './AdminCalendarPage';
import { AdminMenuPage } from './AdminMenuPage';

export default function AdminRoutes(): React.JSX.Element {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="calendar" element={<AdminCalendarPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="bookings" element={<AdminBookingsPage />} />
        <Route path="quotes" element={<AdminQuotesPage />} />
        <Route path="invoices" element={<AdminInvoicesPage />} />
        <Route path="services" element={<AdminServicesPage />} />
        <Route path="monthly-plans" element={<AdminMonthlyPlansPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="menu" element={<AdminMenuPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
