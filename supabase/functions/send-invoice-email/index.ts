import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type SendInvoicePayload = {
  invoiceId?: string;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('INVOICE_FROM_EMAIL') ?? 'Evergreen Garden <noreply@example.com>';
    const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:5173';

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return Response.json(
        { ok: false, error: 'Missing Supabase environment variables.' },
        { status: 500, headers: corsHeaders },
      );
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return Response.json({ ok: false, error: 'Missing authorization header.' }, { status: 401, headers: corsHeaders });
    }

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser();
    if (callerError || !caller) {
      return Response.json({ ok: false, error: 'Unauthorized caller.' }, { status: 401, headers: corsHeaders });
    }

    const { data: callerProfile, error: callerProfileError } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .maybeSingle();
    if (callerProfileError || !callerProfile || callerProfile.role !== 'admin') {
      return Response.json({ ok: false, error: 'Only admins can send invoices.' }, { status: 403, headers: corsHeaders });
    }

    const body = (await request.json()) as SendInvoicePayload;
    const invoiceId = body.invoiceId;
    if (!invoiceId) {
      return Response.json({ ok: false, error: 'invoiceId is required.' }, { status: 400, headers: corsHeaders });
    }

    const { data: invoice, error: invoiceError } = await serviceClient
      .from('invoices')
      .select('id, invoice_number, customer_id, due_date, total')
      .eq('id', invoiceId)
      .maybeSingle();

    if (invoiceError || !invoice) {
      return Response.json({ ok: false, error: 'Invoice not found.' }, { status: 404, headers: corsHeaders });
    }

    const { data: customerProfile } = await serviceClient
      .from('profiles')
      .select('full_name')
      .eq('id', invoice.customer_id)
      .maybeSingle();

    const { data: customerUser, error: customerUserError } = await serviceClient.auth.admin.getUserById(invoice.customer_id);
    if (customerUserError || !customerUser?.user?.email) {
      return Response.json(
        { ok: false, error: 'Customer email is not available on the account.' },
        { status: 400, headers: corsHeaders },
      );
    }

    if (!resendApiKey) {
      return Response.json(
        { ok: false, error: 'RESEND_API_KEY is not configured for transactional email.' },
        { status: 500, headers: corsHeaders },
      );
    }

    const customerName = customerProfile?.full_name ?? 'Customer';
    const invoiceLink = `${appUrl.replace(/\/$/, '')}/invoices`;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [customerUser.user.email],
        subject: `Invoice ${invoice.invoice_number} from Evergreen Garden Services`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #0A4121;">
            <p>Hello ${customerName},</p>
            <p>Your invoice <strong>${invoice.invoice_number}</strong> is now available.</p>
            <p>Total: <strong>R ${Number(invoice.total).toFixed(2)}</strong><br/>Due date: <strong>${invoice.due_date}</strong></p>
            <p>You can view it in your client portal:</p>
            <p><a href="${invoiceLink}">${invoiceLink}</a></p>
            <p>Thank you,<br/>Evergreen Garden Services</p>
          </div>
        `,
      }),
    });

    if (!resendResponse.ok) {
      const details = await resendResponse.text();
      return Response.json(
        { ok: false, error: `Email provider returned ${resendResponse.status}: ${details}` },
        { status: 502, headers: corsHeaders },
      );
    }

    return Response.json({ ok: true }, { headers: corsHeaders });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500, headers: corsHeaders },
    );
  }
});
