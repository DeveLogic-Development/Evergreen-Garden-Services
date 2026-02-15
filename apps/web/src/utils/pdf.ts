function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function exportTableToPdf(title: string, rows: Array<Record<string, string | number | null>>): void {
  const first = rows[0];
  if (!first) {
    return;
  }

  const headers = Object.keys(first);
  const tableHead = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
  const tableBody = rows
    .map((row) => {
      const cells = headers
        .map((header) => {
          const value = row[header];
          return `<td>${escapeHtml(value == null ? '' : String(value))}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #0A4121; }
      h1 { margin: 0 0 8px; font-size: 20px; }
      p { margin: 0 0 16px; font-size: 12px; color: #155128; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #CFDED2; text-align: left; padding: 8px; vertical-align: top; }
      th { background: #F1F3E8; }
      @media print { body { margin: 10mm; } }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <p>Generated ${new Date().toLocaleString()}</p>
    <table>
      <thead><tr>${tableHead}</tr></thead>
      <tbody>${tableBody}</tbody>
    </table>
    <script>
      window.onload = () => {
        window.print();
      };
    </script>
  </body>
</html>`;

  const preview = window.open('', '_blank', 'noopener,noreferrer');
  if (!preview) {
    return;
  }

  preview.document.open();
  preview.document.write(html);
  preview.document.close();
}
