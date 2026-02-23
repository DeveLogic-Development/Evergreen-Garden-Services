import nodemailer from 'nodemailer';

type ContactPayload = {
  name?: string;
  area?: string;
  service?: string;
  message?: string;
};

function json(res: any, status: number, body: Record<string, unknown>) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function parseBody(req: any): ContactPayload {
  if (!req?.body) {
    return {};
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as ContactPayload;
    } catch {
      return {};
    }
  }
  return req.body as ContactPayload;
}

function requireString(value: unknown, field: string, min = 1): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized.length < min) {
    throw new Error(`Invalid ${field}`);
  }
  return normalized;
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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const payload = parseBody(req);
    const name = requireString(payload.name, 'name', 2);
    const area = requireString(payload.area, 'area', 2);
    const service = requireString(payload.service, 'service', 2);
    const message = requireString(payload.message, 'message', 5);

    const { transporter, user } = getTransporter();
    const to = process.env.CONTACT_TO_EMAIL || 'jsuperman55@gmail.com';
    const from = process.env.EMAIL_FROM || user;

    await transporter.sendMail({
      from,
      to,
      replyTo: from,
      subject: `Evergreen landing contact request: ${service}`,
      text: [
        'New landing contact form submission',
        '',
        `Name: ${name}`,
        `Area: ${area}`,
        `Service: ${service}`,
        '',
        'Message:',
        message,
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0A4121">
          <h2 style="margin:0 0 12px">New landing contact request</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Area:</strong> ${escapeHtml(area)}</p>
          <p><strong>Service:</strong> ${escapeHtml(service)}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
        </div>
      `,
    });

    return json(res, 200, { ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send contact email';
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
