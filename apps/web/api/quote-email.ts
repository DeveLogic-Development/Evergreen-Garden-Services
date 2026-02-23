import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

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
    const from = process.env.QUOTE_FROM_EMAIL || process.env.EMAIL_FROM || user;
    const appUrl = (process.env.APP_URL || process.env.VITE_APP_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
    const quoteLink = `${appUrl}/quotes`;
    const logoUrl = `${appUrl}/images/logoEGS.png`;
    const customerName = customerProfile?.full_name ?? 'Customer';

    await transporter.sendMail({
      from,
      to: customerEmail,
      replyTo: from,
      subject: `Quote ${quote.quote_number} from Evergreen Garden Services`,
      text: [
        `Hello ${customerName},`,
        '',
        `Your quote ${quote.quote_number} is ready to review.`,
        `Total: R ${Number(quote.total).toFixed(2)}`,
        `Valid until: ${quote.valid_until}`,
        '',
        `View and accept/decline your quote in the client portal: ${quoteLink}`,
        '',
        'Thank you,',
        'Evergreen Garden Services',
      ].join('\n'),
      html: `
        ${renderBrandedEmail({
          title: 'Your Quote Is Ready',
          eyebrow: 'Evergreen Garden Services',
          customerName,
          intro: `Your quote <strong>${escapeHtml(quote.quote_number)}</strong> is ready to review.`,
          rows: [
            { label: 'Quote number', value: quote.quote_number },
            { label: 'Total', value: `R ${Number(quote.total).toFixed(2)}` },
            { label: 'Valid until', value: quote.valid_until },
          ],
          ctaLabel: 'Review Quote',
          ctaHref: quoteLink,
          footerNote: 'You can view, accept, or decline this quote in your client portal.',
          logoUrl,
        })}
      `,
    });

    return json(res, 200, { ok: true });
  } catch (error) {
    return json(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    });
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderBrandedEmail(input: {
  title: string;
  eyebrow: string;
  customerName: string;
  intro: string;
  rows: Array<{ label: string; value: string }>;
  ctaLabel: string;
  ctaHref: string;
  footerNote: string;
  logoUrl: string;
}): string {
  const rowsHtml = input.rows
    .map(
      (row) => `
        <tr>
          <td style="padding:8px 0;color:#216732;font-size:13px;">${escapeHtml(row.label)}</td>
          <td style="padding:8px 0;color:#0A4121;font-size:13px;font-weight:700;text-align:right;">${escapeHtml(row.value)}</td>
        </tr>
      `,
    )
    .join('');

  return `
    <div style="margin:0;padding:24px 12px;background:#F1F3E8;font-family:Arial,sans-serif;color:#0A4121;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;border-collapse:separate;border-spacing:0;">
        <tr>
          <td style="padding:0 0 14px 0;">
            <div style="background:linear-gradient(135deg,#094A2B,#155128);border-radius:18px;padding:16px 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:56px;vertical-align:middle;">
                    <img src="${escapeHtml(input.logoUrl)}" alt="Evergreen Garden Services" width="48" height="48" style="display:block;border-radius:12px;background:#ffffff;object-fit:contain;" />
                  </td>
                  <td style="vertical-align:middle;padding-left:10px;">
                    <div style="color:#FCEA78;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;font-weight:700;">${escapeHtml(input.eyebrow)}</div>
                    <div style="color:#ffffff;font-size:20px;font-weight:700;line-height:1.2;margin-top:4px;">${escapeHtml(input.title)}</div>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border:1px solid #CFDED2;border-radius:18px;padding:20px;">
            <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;color:#0A4121;">Hello ${escapeHtml(input.customerName)},</p>
            <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#0A4121;">${input.intro}</p>

            <div style="border:1px solid #CFDED2;border-radius:14px;padding:14px 16px;background:#F7F8F1;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                ${rowsHtml}
              </table>
            </div>

            <div style="padding-top:18px;">
              <a href="${escapeHtml(input.ctaHref)}" style="display:inline-block;background:#2F7034;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 16px;border-radius:12px;">
                ${escapeHtml(input.ctaLabel)}
              </a>
            </div>

            <p style="margin:14px 0 0 0;font-size:12px;line-height:1.6;color:#216732;">${escapeHtml(input.footerNote)}</p>
            <p style="margin:14px 0 0 0;font-size:13px;line-height:1.6;color:#0A4121;">Thank you,<br /><strong>Evergreen Garden Services</strong></p>
          </td>
        </tr>
      </table>
    </div>
  `;
}
