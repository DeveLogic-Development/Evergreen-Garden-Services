import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { escapeHtml, renderEmailShell, renderPanel, renderRows } from './_lib/emailTheme';

type SendBookingPayload = {
  bookingId?: string;
};

function json(res: any, status: number, body: Record<string, unknown>) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function parseBody(req: any): SendBookingPayload {
  if (!req?.body) {
    return {};
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as SendBookingPayload;
    } catch {
      return {};
    }
  }
  return req.body as SendBookingPayload;
}

function getTransporter() {
  const user = process.env.SMTP_USER || 'jsuperman55@gmail.com';
  const pass = process.env.SMTP_PASS;
  if (!pass) {
    throw new Error('SMTP_PASS is not configured');
  }
  return {
    transporter: nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    }),
    user,
  };
}

function getSupabaseEnv() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY');
  }
  return { supabaseUrl, supabaseAnonKey, serviceRoleKey };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const { supabaseUrl, supabaseAnonKey, serviceRoleKey } = getSupabaseEnv();
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      return json(res, 401, { ok: false, error: 'Missing authorization header' });
    }

    const body = parseBody(req);
    const bookingId = typeof body.bookingId === 'string' ? body.bookingId.trim() : '';
    if (!bookingId) {
      return json(res, 400, { ok: false, error: 'bookingId is required' });
    }

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser();
    if (callerError || !caller) {
      return json(res, 401, { ok: false, error: 'Unauthorized caller' });
    }

    const { data: callerProfile, error: callerProfileError } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .maybeSingle();
    if (callerProfileError || !callerProfile || callerProfile.role !== 'admin') {
      return json(res, 403, { ok: false, error: 'Only admins can send booking confirmations' });
    }

    const { data: booking, error: bookingError } = await serviceClient
      .from('bookings')
      .select('id, status, requested_datetime, confirmed_datetime, address, customer_id, services(name)')
      .eq('id', bookingId)
      .maybeSingle();
    if (bookingError || !booking) {
      return json(res, 404, { ok: false, error: 'Booking not found' });
    }

    const { data: customerProfile } = await serviceClient
      .from('profiles')
      .select('full_name')
      .eq('id', booking.customer_id)
      .maybeSingle();

    const { data: customerUser, error: customerUserError } = await serviceClient.auth.admin.getUserById(booking.customer_id);
    const customerEmail = customerUser?.user?.email;
    if (customerUserError || !customerEmail) {
      return json(res, 400, { ok: false, error: 'Customer email is not available on the account' });
    }

    const { transporter, user } = getTransporter();
    const from = process.env.BOOKING_FROM_EMAIL || process.env.EMAIL_FROM || user;
    const appUrl = (process.env.APP_URL || process.env.VITE_APP_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
    const bookingsLink = `${appUrl}/bookings`;
    const logoUrl = `${appUrl}/images/logoEGS.png`;
    const customerName = customerProfile?.full_name ?? 'Customer';
    const serviceName = booking.services?.name ?? 'Garden service';
    const confirmedText = booking.confirmed_datetime ? formatDateTime(booking.confirmed_datetime) : 'To be confirmed';
    const requestedText = formatDateTime(booking.requested_datetime);

    await transporter.sendMail({
      from,
      to: customerEmail,
      replyTo: from,
      subject: `Booking confirmed for ${serviceName} | Evergreen Garden Services`,
      text: [
        `Hello ${customerName},`,
        '',
        'Your booking request has been confirmed.',
        `Service: ${serviceName}`,
        `Requested time: ${requestedText}`,
        `Confirmed time: ${confirmedText}`,
        `Status: ${booking.status}`,
        `Address: ${booking.address}`,
        '',
        `View your booking in the client portal: ${bookingsLink}`,
        '',
        'Thank you,',
        'Evergreen Garden Services',
      ].join('\n'),
      html: `
        ${renderEmailShell({
          title: 'Your Booking Is Confirmed',
          eyebrow: 'Evergreen Garden Services',
          subtitle: 'Your service has been scheduled in the client portal.',
          greeting: `Hello ${customerName},`,
          introHtml: `Your booking for <strong>${escapeHtml(serviceName)}</strong> has been confirmed.`,
          bodyHtml:
            renderRows([
              { label: 'Service', value: serviceName },
              { label: 'Requested time', value: requestedText },
              { label: 'Confirmed time', value: confirmedText },
              { label: 'Status', value: booking.status },
            ]) +
            renderPanel('Service address', `<div style="white-space:pre-wrap;">${escapeHtml(booking.address)}</div>`),
          ctaLabel: 'View Booking',
          ctaHref: bookingsLink,
          footerNote: 'You can check booking updates and future service activity in your client portal.',
          logoUrl,
          preheader: `Booking confirmed for ${serviceName}`,
        })}
      `,
    });

    return json(res, 200, { ok: true });
  } catch (error) {
    return json(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Unexpected error' });
  }
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
