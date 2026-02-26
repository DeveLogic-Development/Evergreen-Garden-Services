import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { getPublicSettings, getQuoteById } from '@/lib/api';
import { formatCurrency, formatDate, formatQuoteNumber } from '@/utils/format';

export function QuotePrintPage(): React.JSX.Element {
  const params = useParams();
  const quoteId = params.quoteId ?? '';

  const quoteQuery = useQuery({ queryKey: ['quote', quoteId], queryFn: () => getQuoteById(quoteId) });
  const settingsQuery = useQuery({ queryKey: ['settings-public'], queryFn: getPublicSettings });

  if (quoteQuery.isLoading || settingsQuery.isLoading) {
    return (
      <Card>
        <p>Loading quote...</p>
      </Card>
    );
  }

  if (!quoteQuery.data || !settingsQuery.data) {
    return (
      <Card>
        <p>Quote not found.</p>
      </Card>
    );
  }

  const quote = quoteQuery.data;
  const settings = settingsQuery.data;

  return (
    <article className="mx-auto max-w-3xl space-y-4 bg-surface p-4 md:p-8">
      <header className="flex items-start justify-between border-b border-muted pb-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Quote {formatQuoteNumber(quote.quote_number)}</h1>
          <p className="text-sm text-brand-700">Issued {formatDate(quote.created_at)}</p>
          <p className="text-sm text-brand-700">Valid until {formatDate(quote.valid_until)}</p>
        </div>
        <Button className="print:hidden" onClick={() => window.print()}>
          Print
        </Button>
      </header>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-800">From</h2>
        <p className="font-semibold text-brand-900">{settings.business_name}</p>
        <p className="whitespace-pre-line text-sm text-brand-800">{settings.address}</p>
      </section>

      <section className="space-y-2">
        {(quote.quote_items ?? []).map((item) => (
          <div key={item.id} className="grid grid-cols-[1fr_auto] gap-2 border-b border-muted py-2 text-sm">
            <p>
              {item.description} ({item.qty} x {formatCurrency(item.unit_price)})
            </p>
            <p className="font-medium">{formatCurrency(item.line_total)}</p>
          </div>
        ))}
      </section>

      <section className="ml-auto max-w-xs space-y-1 rounded-xl bg-bg p-4">
        <p className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatCurrency(quote.subtotal)}</span>
        </p>
        <p className="flex justify-between text-sm">
          <span>VAT</span>
          <span>{formatCurrency(quote.vat_amount)}</span>
        </p>
        <p className="flex justify-between border-t border-muted pt-2 text-base font-semibold text-brand-900">
          <span>Total</span>
          <span>{formatCurrency(quote.total)}</span>
        </p>
      </section>

      <section className="rounded-xl bg-accent-500 p-3 text-sm text-brand-900">
        Free Quote: Thank you for choosing Evergreen Garden Services.
      </section>
    </article>
  );
}
