import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { escapeHtml, renderEmailShell, renderRows } from './_lib/emailTheme.js';

type SendQuotePayload = {
  quoteId?: string;
};

function json(res: any, status: number, body: Record<string, unknown>) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function parseBody(req: any): SendQuotePayload {
  if (!req?.body) {
    return {};
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as SendQuotePayload;
    } catch {
      return {};
    }
  }
  return req.body as SendQuotePayload;
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

function resolveMailHeaders(smtpUser: string, configuredReplyTo?: string) {
  const replyTo = (configuredReplyTo || '').trim() || smtpUser;
  return {
    from: `Evergreen Garden Services <${smtpUser}>`,
    replyTo,
  };
}

function getSupabaseEnv() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
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
    const quoteId = typeof body.quoteId === 'string' ? body.quoteId.trim() : '';
    if (!quoteId) {
      return json(res, 400, { ok: false, error: 'quoteId is required' });
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
      return json(res, 403, { ok: false, error: 'Only admins can send quotes' });
    }

    const { data: quote, error: quoteError } = await serviceClient
      .from('quotes')
      .select('id, quote_number, customer_id, valid_until, total')
      .eq('id', quoteId)
      .maybeSingle();
    if (quoteError || !quote) {
      return json(res, 404, { ok: false, error: 'Quote not found' });
    }

    const { data: customerProfile } = await serviceClient
      .from('profiles')
      .select('full_name')
      .eq('id', quote.customer_id)
      .maybeSingle();

    const { data: customerUser, error: customerUserError } = await serviceClient.auth.admin.getUserById(quote.customer_id);
    const customerEmail = customerUser?.user?.email;
    if (customerUserError || !customerEmail) {
      return json(res, 400, { ok: false, error: 'Customer email is not available on the account' });
    }

    const { transporter, user } = getTransporter();
    const configuredReplyTo = process.env.QUOTE_FROM_EMAIL || process.env.EMAIL_FROM || user;
    const mailHeaders = resolveMailHeaders(user, configuredReplyTo);
    const appUrl = (process.env.APP_URL || process.env.VITE_APP_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
    const loginLink = `${appUrl}/login`;
    const logoUrl = `${appUrl}/images/logoEGS.png`;
    const customerName = customerProfile?.full_name ?? 'Customer';

    await transporter.sendMail({
      from: mailHeaders.from,
      to: customerEmail,
      replyTo: mailHeaders.replyTo,
      subject: `Quote ${quote.quote_number} from Evergreen Garden Services`,
      text: [
        `Hello ${customerName},`,
        '',
        `Your quote ${quote.quote_number} is ready to review.`,
        `Total: R ${Number(quote.total).toFixed(2)}`,
        `Valid until: ${quote.valid_until}`,
        '',
        `Sign in to your client portal to review your quote: ${loginLink}`,
        '',
        'Thank you,',
        'Evergreen Garden Services',
      ].join('\n'),
      html: `
        ${renderEmailShell({
          title: 'Your Quote Is Ready',
          eyebrow: 'Evergreen Garden Services',
          subtitle: 'Review and respond in your client portal.',
          greeting: `Hello ${customerName},`,
          introHtml: `Your quote <strong>${escapeHtml(quote.quote_number)}</strong> is ready to review.`,
          bodyHtml: renderRows([
            { label: 'Quote number', value: quote.quote_number },
            { label: 'Total', value: `R ${Number(quote.total).toFixed(2)}` },
            { label: 'Valid until', value: quote.valid_until },
          ]),
          ctaLabel: 'Review Quote',
          ctaHref: loginLink,
          footerNote: 'Sign in to your client portal to view, accept, or decline this quote.',
          logoUrl,
          preheader: `Quote ${quote.quote_number} is ready to review`,
        })}
      `,
    });

    return json(res, 200, { ok: true });
  } catch (error) {
    console.error('quote-email error', error);
    return json(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    });
  }
}
