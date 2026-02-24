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

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
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

export function renderEmailShell(input: {
  logoUrl?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  introHtml?: string;
  bodyHtml?: string;
  footerNote?: string;
  preheader?: string;
}): string {
  const logoHtml = input.logoUrl
    ? `<img src="${escapeHtml(input.logoUrl)}" alt="Evergreen Garden Services" width="48" height="48" style="display:block;border-radius:12px;background:#ffffff;object-fit:contain;" />`
    : `<div style="width:48px;height:48px;border-radius:12px;background:${COLORS.surface};border:1px solid ${COLORS.muted};"></div>`;

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
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};">
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
                            ${
                              input.subtitle
                                ? `<p style="margin:8px 0 0 0;font-size:13px;line-height:1.5;color:#EAF4EE;">${escapeHtml(input.subtitle)}</p>`
                                : ''
                            }
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background:${COLORS.surface};border:1px solid ${COLORS.muted};border-radius:18px;padding:18px;">
                    ${
                      input.introHtml
                        ? `<p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:${COLORS.brand800};">${input.introHtml}</p>`
                        : ''
                    }
                    ${input.bodyHtml ?? ''}
                    ${
                      input.footerNote
                        ? `<p style="margin:14px 0 0 0;font-size:12px;line-height:1.6;color:${COLORS.brand600};">${escapeHtml(input.footerNote)}</p>`
                        : ''
                    }
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

