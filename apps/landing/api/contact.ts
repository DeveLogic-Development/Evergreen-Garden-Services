import nodemailer from 'nodemailer';
import { escapeHtml, renderEmailShell, renderPanel } from './_lib/emailTheme.js';

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

function resolveMailHeaders(smtpUser: string, configuredReplyTo?: string) {
  const replyTo = (configuredReplyTo || '').trim() || smtpUser;
  return {
    from: `Evergreen Garden Services <${smtpUser}>`,
    replyTo,
  };
}

function buildTextEmail(name: string, area: string, service: string, message: string): string {
  return [
    'Evergreen landing notification',
    '',
    'New contact request received',
    '',
    `Name: ${name}`,
    `Area: ${area}`,
    `Service requested: ${service}`,
    '',
    'Message:',
    message,
    '',
    'Next step: reply from your business email or contact the client directly.',
  ].join('\n');
}

function buildHtmlEmail(name: string, area: string, service: string, message: string) {
  return renderPanel(
    'Lead summary',
    `
      <div style="display:inline-block;background:#EAF4EE;border:1px solid #CFDED2;color:#155128;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;">
        New Website Lead
      </div>
      <div style="margin-top:10px;"><strong>Name:</strong> ${escapeHtml(name)}</div>
      <div style="margin-top:6px;"><strong>Area:</strong> ${escapeHtml(area)}</div>
      <div style="margin-top:6px;"><strong>Service requested:</strong> ${escapeHtml(service)}</div>
    `,
  )
    + renderPanel('Message', `<div style="white-space:pre-wrap;">${escapeHtml(message)}</div>`)
    + renderPanel(
      'Next step',
      'Reply from your business email or follow up with the client in your preferred CRM workflow.',
    );
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
    const mailHeaders = resolveMailHeaders(user, process.env.EMAIL_FROM || user);
    const appUrl = (process.env.APP_URL || process.env.VITE_APP_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
    const logoUrl = `${appUrl}/images/logoEGS.png`;

    await transporter.sendMail({
      from: mailHeaders.from,
      to,
      replyTo: mailHeaders.replyTo,
      subject: `Evergreen landing contact request: ${service}`,
      text: buildTextEmail(name, area, service, message),
      html: `
        ${renderEmailShell({
          eyebrow: 'Landing Website',
          title: 'New Contact Request',
          subtitle: 'Lead enquiry submitted from the Evergreen landing page.',
          introHtml: 'A visitor submitted the contact form on the landing website.',
          bodyHtml: buildHtmlEmail(name, area, service, message),
          footerNote: 'Follow up with this client from your preferred business email or CRM workflow.',
          logoUrl,
          preheader: `New contact request for ${service}`,
        })}
      `,
    });

    return json(res, 200, { ok: true });
  } catch (error) {
    console.error('landing-contact-email error', error);
    const message = error instanceof Error ? error.message : 'Failed to send contact email';
    return json(res, 500, { ok: false, error: message });
  }
}
