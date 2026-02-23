import nodemailer from 'nodemailer';

type NotificationType = 'booking_created' | 'quote_created' | 'invoice_created';

type NotificationPayload = {
  type?: NotificationType;
  title?: string;
  summary?: string;
  details?: Record<string, unknown>;
};

function json(res: any, status: number, body: Record<string, unknown>) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function parseBody(req: any): NotificationPayload {
  if (!req?.body) {
    return {};
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as NotificationPayload;
    } catch {
      return {};
    }
  }
  return req.body as NotificationPayload;
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

function normalize(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  return String(value);
}

function formatDetails(details?: Record<string, unknown>) {
  const entries = Object.entries(details ?? {}).filter(([, value]) => value !== undefined && value !== null && `${value}` !== '');
  const lines = entries.map(([key, value]) => `${key}: ${normalize(value)}`);
  const html = entries
    .map(([key, value]) => `<p style="margin:4px 0"><strong>${escapeHtml(key)}:</strong> ${escapeHtml(normalize(value))}</p>`)
    .join('');
  return { lines, html };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const payload = parseBody(req);
    if (!payload.type || !['booking_created', 'quote_created', 'invoice_created'].includes(payload.type)) {
      return json(res, 400, { ok: false, error: 'Invalid notification type' });
    }

    const title = normalize(payload.title) || payload.type.replaceAll('_', ' ');
    const summary = normalize(payload.summary);
    const { lines, html } = formatDetails(payload.details);

    const { transporter, user } = getTransporter();
    const to = process.env.NOTIFY_TO_EMAIL || 'jsuperman55@gmail.com';
    const from = process.env.EMAIL_FROM || user;

    await transporter.sendMail({
      from,
      to,
      replyTo: from,
      subject: `Evergreen notification: ${title}`,
      text: ['Evergreen web notification', '', `Type: ${payload.type}`, `Title: ${title}`, summary ? `Summary: ${summary}` : '', '', ...lines]
        .filter(Boolean)
        .join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0A4121">
          <h2 style="margin:0 0 10px">Evergreen web notification</h2>
          <p><strong>Type:</strong> ${escapeHtml(payload.type)}</p>
          <p><strong>Title:</strong> ${escapeHtml(title)}</p>
          ${summary ? `<p><strong>Summary:</strong> ${escapeHtml(summary)}</p>` : ''}
          ${html}
        </div>
      `,
    });

    return json(res, 200, { ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send notification email';
    return json(res, 500, { ok: false, error: message });
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
