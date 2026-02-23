type WebNotificationType = 'booking_created' | 'quote_created' | 'invoice_created';

export async function sendWebEmailNotification(input: {
  type: WebNotificationType;
  title: string;
  summary?: string;
  details?: Record<string, unknown>;
}): Promise<boolean> {
  try {
    const response = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      return false;
    }
    const payload = (await response.json().catch(() => null)) as { ok?: boolean } | null;
    return payload?.ok !== false;
  } catch {
    return false;
  }
}
