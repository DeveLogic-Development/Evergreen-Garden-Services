import nodemailer from 'nodemailer';
import { escapeHtml, renderEmailShell, renderPanel } from './_lib/emailTheme.js';

type NotificationType = 'booking_created' | 'quote_created' | 'invoice_created';

type NotificationPayload = {
  type?: NotificationType;
  title?: string;
  summary?: string;
  details?: Record<string, unknown>;
};

const TYPE_LABELS: Record<NotificationType, string> = {
  booking_created: 'Booking Created',
  quote_created: 'Quote Created',
  invoice_created: 'Invoice Created',
};

const DETAIL_LABELS: Record<string, string> = {
  quote_id: 'Quote ID',
  invoice_id: 'Invoice ID',
  booking_id: 'Booking ID',
  customer_id: 'Customer ID',
  customer_name: 'Customer name',
  service: 'Service',
  valid_until: 'Valid until',
  issue_date: 'Issue date',
  due_date: 'Due date',
  vat_rate: 'VAT rate',
  item_count: 'Line items',
  source: 'Source',
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

function resolveMailHeaders(smtpUser: string, configuredReplyTo?: string) {
  const replyTo = (configuredReplyTo || '').trim() || smtpUser;
  return {
    from: `Evergreen Garden Services <${smtpUser}>`,
    replyTo,
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

function humanizeKey(key: string): string {
  return (
    DETAIL_LABELS[key] ??
    key
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function prettifyType(type: NotificationType): string {
  return TYPE_LABELS[type] ?? type.replaceAll('_', ' ');
}

function isIdentifierKey(key: string): boolean {
  return key.endsWith('_id');
}

function formatDetailValue(key: string, value: string): string {
  if (key === 'vat_rate') {
    const asNumber = Number(value);
    if (!Number.isNaN(asNumber)) {
      return `${(asNumber * 100).toFixed(asNumber * 100 % 1 === 0 ? 0 : 2)}%`;
    }
  }
  return value;
}

function buildDetailSections(details?: Record<string, unknown>) {
  const entries = Object.entries(details ?? {})
    .filter(([, value]) => value !== undefined && value !== null && `${value}` !== '')
    .map(([key, rawValue]) => {
      const normalized = normalize(rawValue);
      return {
        key,
        label: humanizeKey(key),
        value: formatDetailValue(key, normalized),
      };
    });

  const primary = entries.filter((entry) => !isIdentifierKey(entry.key));
  const references = entries.filter((entry) => isIdentifierKey(entry.key));

  const lines = entries.map((entry) => `${entry.label}: ${entry.value}`);

  const makeTable = (sectionEntries: typeof entries) =>
    sectionEntries
      .map(
        (entry) => `
          <tr>
            <td style="padding:8px 0;color:#216732;font-size:12px;line-height:1.4;vertical-align:top;width:38%;padding-right:12px;">${escapeHtml(entry.label)}</td>
            <td style="padding:8px 0;color:#0A4121;font-size:13px;line-height:1.45;vertical-align:top;">
              <div style="${
                isIdentifierKey(entry.key)
                  ? 'font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;background:#F7F8F1;border:1px solid #CFDED2;border-radius:8px;padding:6px 8px;word-break:break-all;'
                  : 'font-weight:700;'
              }">
                ${escapeHtml(entry.value)}
              </div>
            </td>
          </tr>
        `,
      )
      .join('');

  const primaryHtml = primary.length
    ? renderPanel(
        'What happened',
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${makeTable(primary)}</table>`,
      )
    : '';

  const referenceHtml = references.length
    ? renderPanel(
        'Reference IDs',
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${makeTable(references)}</table>`,
      )
    : '';

  return { lines, primaryHtml, referenceHtml };
}

function formatSummaryBadge(type: NotificationType, title: string, summary: string) {
  return renderPanel(
    'Event summary',
    `
      <div style="display:inline-block;background:#EAF4EE;border:1px solid #CFDED2;color:#155128;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;">
        ${escapeHtml(prettifyType(type))}
      </div>
      <div style="margin-top:10px;"><strong>Title:</strong> ${escapeHtml(title)}</div>
      ${summary ? `<div style="margin-top:6px;"><strong>Summary:</strong> ${escapeHtml(summary)}</div>` : ''}
    `,
  );
}

function formatDetails(details?: Record<string, unknown>) {
  const sections = buildDetailSections(details);
  const html = sections.primaryHtml + sections.referenceHtml;
  return { lines: sections.lines, html };
}

function buildTextSummary(payload: NotificationPayload, title: string, summary: string, lines: string[]) {
  const type = payload.type ? prettifyType(payload.type) : '';
  return [
    'Evergreen web notification',
    '',
    type ? `Event: ${type}` : '',
    `Title: ${title}`,
    summary ? `Summary: ${summary}` : '',
    '',
    ...lines,
  ]
    .filter(Boolean)
    .join('\n');
}

function buildIntro(payloadType: NotificationType): string {
  const label = prettifyType(payloadType);
  return `A new <strong>${escapeHtml(label)}</strong> event was recorded in the Evergreen web app.`;
}

function buildNotificationHtml(payload: NotificationPayload, title: string, summary: string, detailsHtml: string): string {
  if (!payload.type) {
    return '';
  }
  return formatSummaryBadge(payload.type, title, summary) + (detailsHtml || '');
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

    const title = normalize(payload.title) || prettifyType(payload.type);
    const summary = normalize(payload.summary);
    const { lines, html } = formatDetails(payload.details);

    const { transporter, user } = getTransporter();
    const to = process.env.NOTIFY_TO_EMAIL || 'jsuperman55@gmail.com';
    const mailHeaders = resolveMailHeaders(user, process.env.EMAIL_FROM || user);
    const appUrl = (process.env.APP_URL || process.env.VITE_APP_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
    const logoUrl = `${appUrl}/images/logoEGS.png`;
    const loginLink = `${appUrl}/login`;

    await transporter.sendMail({
      from: mailHeaders.from,
      to,
      replyTo: mailHeaders.replyTo,
      subject: `Evergreen notification: ${title}`,
      text: buildTextSummary(payload, title, summary, lines),
      html: `
        ${renderEmailShell({
          eyebrow: 'Evergreen Web Event',
          title: 'Internal Notification',
          subtitle: 'Automated event update from the Evergreen web app.',
          greeting: 'Hello,',
          introHtml: buildIntro(payload.type),
          bodyHtml: buildNotificationHtml(payload, title, summary, html),
          ctaLabel: 'Sign in to Evergreen',
          ctaHref: loginLink,
          footerNote: 'This is an internal notification email generated by the Evergreen web application.',
          logoUrl,
          preheader: `Evergreen notification: ${title}`,
        })}
      `,
    });

    return json(res, 200, { ok: true });
  } catch (error) {
    console.error('notify-email error', error);
    const message = error instanceof Error ? error.message : 'Failed to send notification email';
    return json(res, 500, { ok: false, error: message });
  }
}
