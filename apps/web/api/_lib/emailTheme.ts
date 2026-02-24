const COLORS = {
  brand900: '#094A2B',
  brand800: '#0A4121',
  brand700: '#155128',
  brand600: '#216732',
  brand500: '#2F7034',
  accent500: '#FCEA78',
  bg: '#F1F3E8',
  surface: '#FFFFFF',
  muted: '#CFDED2',
} as const;

function toText(value: unknown): string {
  if (value == null) {
    return '';
  }
  return String(value);
}

export function escapeHtml(value: unknown): string {
  return toText(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderRows(rows: Array<{ label: string; value: unknown }>): string {
  if (!rows.length) {
    return '';
  }

  const rowsHtml = rows
    .map(
      (row) => `
        <tr>
          <td style="padding:8px 0;color:${COLORS.brand600};font-size:13px;line-height:1.4;vertical-align:top;">${escapeHtml(row.label)}</td>
          <td style="padding:8px 0;color:${COLORS.brand800};font-size:13px;line-height:1.4;font-weight:700;text-align:right;vertical-align:top;">${escapeHtml(row.value) || '-'}</td>
        </tr>
      `,
    )
    .join('');

  return `
    <div style="margin:0 0 14px 0;border:1px solid ${COLORS.muted};border-radius:14px;padding:14px 16px;background:#F7F8F1;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${rowsHtml}
      </table>
    </div>
  `;
}

export function renderPanel(title: string, bodyHtml: string): string {
  return `
    <div style="margin:0 0 14px 0;border:1px solid ${COLORS.muted};border-radius:14px;padding:14px 16px;background:#F7F8F1;">
      <div style="font-size:12px;color:${COLORS.brand600};font-weight:700;letter-spacing:0.4px;text-transform:uppercase;margin:0 0 6px 0;">
        ${escapeHtml(title)}
      </div>
      <div style="font-size:13px;line-height:1.55;color:${COLORS.brand800};">${bodyHtml}</div>
    </div>
  `;
}

export function renderButton(label: string, href: string): string {
  return `
    <a href="${escapeHtml(href)}" style="display:inline-block;background:${COLORS.brand500};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;line-height:1;padding:13px 16px;border-radius:12px;border:1px solid ${COLORS.brand700};">
      ${escapeHtml(label)}
    </a>
  `;
}

export function renderEmailShell(input: {
  logoUrl?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  greeting?: string;
  introHtml?: string;
  bodyHtml?: string;
  ctaLabel?: string;
  ctaHref?: string;
  footerNote?: string;
  preheader?: string;
}): string {
  const logoHtml = input.logoUrl
    ? `<img src="${escapeHtml(input.logoUrl)}" alt="Evergreen Garden Services" width="48" height="48" style="display:block;border-radius:12px;background:#ffffff;object-fit:contain;" />`
    : `<div style="width:48px;height:48px;border-radius:12px;background:${COLORS.surface};border:1px solid ${COLORS.muted};"></div>`;

  const ctaHtml = input.ctaLabel && input.ctaHref ? `<div style="padding-top:4px;">${renderButton(input.ctaLabel, input.ctaHref)}</div>` : '';
  const subtitleHtml = input.subtitle
    ? `<p style="margin:8px 0 0 0;font-size:13px;line-height:1.5;color:#EAF4EE;">${escapeHtml(input.subtitle)}</p>`
    : '';
  const greetingHtml = input.greeting
    ? `<p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;color:${COLORS.brand800};">${escapeHtml(input.greeting)}</p>`
    : '';
  const introHtml = input.introHtml
    ? `<p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:${COLORS.brand800};">${input.introHtml}</p>`
    : '';

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light" />
        <title>${escapeHtml(input.title)}</title>
      </head>
      <body style="margin:0;padding:0;background:${COLORS.bg};">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
          ${escapeHtml(input.preheader || input.title)}
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};margin:0;padding:0;">
          <tr>
            <td style="padding:20px 10px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;border-collapse:separate;border-spacing:0;">
                <tr>
                  <td style="padding:0 0 12px 0;">
                    <div style="background:linear-gradient(135deg,${COLORS.brand900},${COLORS.brand700});border-radius:20px;padding:16px;border:1px solid #0B5B31;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width:56px;vertical-align:top;">${logoHtml}</td>
                          <td style="padding-left:10px;vertical-align:top;">
                            <div style="color:${COLORS.accent500};font-size:11px;line-height:1.2;letter-spacing:1.4px;text-transform:uppercase;font-weight:700;">
                              ${escapeHtml(input.eyebrow)}
                            </div>
                            <div style="color:#ffffff;font-size:20px;line-height:1.2;font-weight:700;margin-top:4px;">
                              ${escapeHtml(input.title)}
                            </div>
                            ${subtitleHtml}
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background:${COLORS.surface};border:1px solid ${COLORS.muted};border-radius:18px;padding:18px;">
                    ${greetingHtml}
                    ${introHtml}
                    ${input.bodyHtml ?? ''}
                    ${ctaHtml}
                    ${
                      input.footerNote
                        ? `<p style="margin:14px 0 0 0;font-size:12px;line-height:1.6;color:${COLORS.brand600};">${escapeHtml(input.footerNote)}</p>`
                        : ''
                    }
                    <div style="margin:14px 0 0 0;padding-top:12px;border-top:1px solid ${COLORS.muted};">
                      <p style="margin:0;font-size:13px;line-height:1.6;color:${COLORS.brand800};">
                        Thank you,<br />
                        <strong>Evergreen Garden Services</strong>
                      </p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 6px 0 6px;text-align:center;">
                    <p style="margin:0;font-size:11px;line-height:1.5;color:${COLORS.brand600};">
                      Evergreen Garden Services • Designed for reliable garden care workflows
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
