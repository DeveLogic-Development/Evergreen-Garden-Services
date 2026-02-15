export function downloadCsv(filename: string, rows: Array<Record<string, string | number | null>>): void {
  const firstRow = rows[0];
  if (!firstRow) {
    return;
  }

  const headers = Object.keys(firstRow);
  const escape = (value: string | number | null): string => {
    const text = value == null ? '' : String(value);
    return `"${text.replaceAll('"', '""')}"`;
  };

  const body = rows
    .map((row) => headers.map((header) => escape(row[header] ?? '')).join(','))
    .join('\n');

  const csv = [headers.join(','), body].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
