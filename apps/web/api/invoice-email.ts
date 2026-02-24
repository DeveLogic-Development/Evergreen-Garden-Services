import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { escapeHtml, renderEmailShell, renderRows } from './_lib/emailTheme';

type SendInvoicePayload = {
  invoiceId?: string;
};

function json(res: any, status: number, body: Record<string, unknown>) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function parseBody(req: any): SendInvoicePayload {
  if (!req?.body) {
    return {};
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as SendInvoicePayload;
    } catch {
      return {};
    }
  }
  return req.body as SendInvoicePayload;
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
    const invoiceId = typeof body.invoiceId === 'string' ? body.invoiceId.trim() : '';
    if (!invoiceId) {
      return json(res, 400, { ok: false, error: 'invoiceId is required' });
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
      return json(res, 403, { ok: false, error: 'Only admins can send invoices' });
    }

    const { data: invoice, error: invoiceError } = await serviceClient
      .from('invoices')
      .select('id, invoice_number, customer_id, due_date, total')
      .eq('id', invoiceId)
      .maybeSingle();

    if (invoiceError || !invoice) {
      return json(res, 404, { ok: false, error: 'Invoice not found' });
    }

    const { data: customerProfile } = await serviceClient
      .from('profiles')
      .select('full_name')
      .eq('id', invoice.customer_id)
      .maybeSingle();

    const { data: customerUser, error: customerUserError } = await serviceClient.auth.admin.getUserById(invoice.customer_id);
    const customerEmail = customerUser?.user?.email;
    if (customerUserError || !customerEmail) {
      return json(res, 400, { ok: false, error: 'Customer email is not available on the account' });
    }

    const { transporter, user } = getTransporter();
    const from = process.env.INVOICE_FROM_EMAIL || process.env.EMAIL_FROM || user;
    const appUrl = (process.env.APP_URL || process.env.VITE_APP_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
    const invoiceLink = `${appUrl}/invoices`;
    const logoUrl = `${appUrl}/images/logoEGS.png`;
    const customerName = customerProfile?.full_name ?? 'Customer';

    await transporter.sendMail({
      from,
      to: customerEmail,
      replyTo: from,
      subject: `Invoice ${invoice.invoice_number} from Evergreen Garden Services`,
      text: [
        `Hello ${customerName},`,
        '',
        `Your invoice ${invoice.invoice_number} is now available.`,
        `Total: R ${Number(invoice.total).toFixed(2)}`,
        `Due date: ${invoice.due_date}`,
        '',
        `View your invoice in your client portal: ${invoiceLink}`,
        '',
        'Thank you,',
        'Evergreen Garden Services',
      ].join('\n'),
      html: `
        ${renderEmailShell({
          title: 'Your Invoice Is Ready',
          eyebrow: 'Evergreen Garden Services',
          subtitle: 'View your invoice and upload proof of payment.',
          greeting: `Hello ${customerName},`,
          introHtml: `Your invoice <strong>${escapeHtml(invoice.invoice_number)}</strong> is now available.`,
          bodyHtml: renderRows([
            { label: 'Invoice number', value: invoice.invoice_number },
            { label: 'Total', value: `R ${Number(invoice.total).toFixed(2)}` },
            { label: 'Due date', value: invoice.due_date },
          ]),
          ctaLabel: 'View Invoice',
          ctaHref: invoiceLink,
          footerNote: 'You can view this invoice and upload proof of payment in your client portal.',
          logoUrl,
          preheader: `Invoice ${invoice.invoice_number} is ready`,
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
