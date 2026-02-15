# Supabase Finalization Checklist

1. Run `supabase/schema.sql` in SQL Editor.
2. Create at least one app user (signup).
3. Run `supabase/admin-setup.sql` with that user's UUID.
4. In Supabase Auth > URL Configuration:
   - Site URL: `http://localhost:5173`
   - Redirect URLs include: `http://localhost:5173/reset-password`
5. Confirm storage bucket exists: `documents` (private).
6. (Optional for invoice email) Deploy edge function `send-invoice-email` and set:
   - `RESEND_API_KEY`
   - `INVOICE_FROM_EMAIL`
   - `APP_URL`
