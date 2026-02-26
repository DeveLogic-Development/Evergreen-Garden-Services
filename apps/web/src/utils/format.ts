const zarFormatter = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-ZA', {
  dateStyle: 'medium',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-ZA', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatCurrency(value: number): string {
  return zarFormatter.format(value);
}

export function formatDate(value: string | Date): string {
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(new Date(value));
}

export function formatQuoteNumber(value: string): string {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) {
    return String(value ?? '');
  }
  const normalized = String(Number.parseInt(digits, 10));
  if (normalized === 'NaN') {
    return String(value ?? '');
  }
  return normalized.padStart(3, '0');
}

export function formatInvoiceNumber(value: string): string {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) {
    return String(value ?? '');
  }
  const normalized = String(Number.parseInt(digits, 10));
  if (normalized === 'NaN') {
    return String(value ?? '');
  }
  return normalized.padStart(3, '0');
}

export function isOverdue(dueDate: string, status: string): boolean {
  if (status !== 'sent') {
    return false;
  }
  const due = new Date(dueDate);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return due < today;
}
