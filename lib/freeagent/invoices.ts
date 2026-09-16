import { apiRequest } from './client';
import { toAttachment, type EvidenceFile } from './explanations';

export type InvoiceItemInput = {
  description: string;
  amount: number;
  categoryUrl: string;
};

export type CreateInvoiceInput = {
  contactUrl: string;
  datedOn: string;
  reference: string;
  items: InvoiceItemInput[];
};

/**
 * Creates an invoice and moves it out of Draft (mark_as_sent — no email is sent). FreeAgent has
 * no API way to record a payment/mark an invoice Paid other than reconciling it against a bank
 * transaction, which this app deliberately doesn't do, so status only ever reaches Open/Overdue.
 */
export async function createInvoice(input: CreateInvoiceInput, evidence?: EvidenceFile): Promise<{ url: string }> {
  const payload: Record<string, unknown> = {
    contact: input.contactUrl,
    dated_on: input.datedOn,
    reference: input.reference,
    payment_terms_in_days: 0,
    invoice_items: input.items.map((item) => ({
      description: item.description,
      item_type: 'Services',
      price: item.amount,
      quantity: 1,
      category: item.categoryUrl,
      // This is an Income Tax (ITSA) bridging import, not a VAT return — the real template has
      // no VAT column, so rather than let FreeAgent silently apply an account/category default
      // (standard rate, on a VAT-registered account) we pin every item to 0% explicitly.
      sales_tax_rate: '0.0',
    })),
  };

  if (evidence) {
    payload.attachment = toAttachment(evidence);
  }

  const { invoice } = await apiRequest<{ invoice: { url: string } }>('/invoices', {
    method: 'POST',
    body: { invoice: payload },
  });

  const id = invoice.url.split('/').filter(Boolean).pop();
  await apiRequest(`/invoices/${id}/transitions/mark_as_sent`, { method: 'PUT' });

  return invoice;
}
