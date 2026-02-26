import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { getInvoiceById, getPublicSettings } from '@/lib/api';
import { formatCurrency, formatDate, formatInvoiceNumber } from '@/utils/format';

export function InvoicePrintPage(): React.JSX.Element {
  const params = useParams();
  const invoiceId = params.invoiceId ?? '';

  const invoiceQuery = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => getInvoiceById(invoiceId),
  });

  const settingsQuery = useQuery({ queryKey: ['settings-public'], queryFn: getPublicSettings });

  if (invoiceQuery.isLoading || settingsQuery.isLoading) {
    return (
      <Card>
        <p>Loading invoice...</p>
      </Card>
    );
  }

  if (!invoiceQuery.data || !settingsQuery.data) {
    return (
      <Card>
        <p>Invoice not found.</p>
      </Card>
    );
  }

  const invoice = invoiceQuery.data;
  const settings = settingsQuery.data;

  return (
    <article className="mx-auto max-w-3xl space-y-4 bg-surface p-4 md:p-8">
      <header className="flex items-start justify-between border-b border-muted pb-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Invoice {formatInvoiceNumber(invoice.invoice_number)}</h1>
          <p className="text-sm text-brand-700">Issue date {formatDate(invoice.issue_date)}</p>
          <p className="text-sm text-brand-700">Due date {formatDate(invoice.due_date)}</p>
        </div>
        <Button className="print:hidden" onClick={() => window.print()}>
          Print
        </Button>
      </header>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-800">Business details</h2>
        <p className="font-semibold text-brand-900">{settings.business_name}</p>
        <p className="whitespace-pre-line text-sm text-brand-800">{settings.address}</p>
        <p className="whitespace-pre-line text-sm text-brand-800">{settings.banking_details}</p>
      </section>

      <section className="space-y-2">
        {(invoice.invoice_items ?? []).map((item) => (
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
          <span>{formatCurrency(invoice.subtotal)}</span>
        </p>
        <p className="flex justify-between text-sm">
          <span>VAT</span>
          <span>{formatCurrency(invoice.vat_amount)}</span>
        </p>
        <p className="flex justify-between border-t border-muted pt-2 text-base font-semibold text-brand-900">
          <span>Total</span>
          <span>{formatCurrency(invoice.total)}</span>
        </p>
      </section>

      <section className="rounded-xl bg-accent-500 p-3 text-sm text-brand-900">
        Please use EFT reference: {formatInvoiceNumber(invoice.invoice_number)}
      </section>
    </article>
  );
}
