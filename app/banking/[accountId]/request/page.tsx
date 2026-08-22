import Link from 'next/link';
import { ensureSeeded } from '@/lib/repo';
import { dateFmt, money } from '@/lib/format';

export default async function RequestComposerPage({
  params,
  searchParams,
}: {
  params: Promise<{ accountId: string }>;
  searchParams: Promise<{ ids?: string | string[] }>;
}) {
  const { accountId } = await params;
  const search = await searchParams;
  const rawIds = Array.isArray(search.ids) ? search.ids : search.ids ? [search.ids] : [];
  const ids = rawIds.map((id) => Number(id)).filter(Boolean);

  const db = ensureSeeded();
  const account = db
    .prepare(
      `SELECT a.id, a.name, c.id as clientId, c.name as clientName, c.contactName, c.email, c.smartCaptureAllowance, c.smartCaptureUsed
       FROM bank_accounts a JOIN clients c ON c.id = a.clientId WHERE a.id = ?`,
    )
    .get(accountId) as {
    id: number;
    name: string;
    clientId: number;
    clientName: string;
    contactName: string;
    email: string;
    smartCaptureAllowance: number;
    smartCaptureUsed: number;
  };

  const placeholders = ids.map(() => '?').join(',');
  const selected = ids.length
    ? (db
        .prepare(
          `SELECT id, date, merchant, amountOut FROM transactions WHERE accountId = ? AND id IN (${placeholders}) ORDER BY date DESC`,
        )
        .all(accountId, ...ids) as Array<{ id: number; date: string; merchant: string; amountOut: number }>)
    : [];

  const remaining = account.smartCaptureAllowance - account.smartCaptureUsed;

  return (
    <div className="space-y-4">
      <Link href={`/banking/${accountId}`} className="text-sm">← Back to transactions</Link>
      <section className="bg-white border border-line rounded-lg p-4">
        <h2 className="font-semibold text-lg">Request paperwork</h2>
        <p className="text-sm mt-1">{account.contactName} has {remaining} Smart Captures left this month — you&apos;re requesting {selected.length}.</p>
        {selected.length > remaining ? (
          <p className="text-sm text-red mt-2">Warning: this request exceeds remaining allowance.</p>
        ) : null}

        <form method="post" action="/api/requests" className="mt-4 space-y-4">
          <input type="hidden" name="accountId" value={accountId} />
          <input type="hidden" name="clientId" value={account.clientId} />

          <div>
            <h3 className="font-medium mb-2">Selected transactions</h3>
            <ul className="space-y-1 text-sm">
              {selected.map((txn) => (
                <li key={txn.id} className="flex justify-between border border-line rounded p-2">
                  <span>{dateFmt(txn.date)} · {txn.merchant}</span>
                  <span>{money(txn.amountOut)}</span>
                  <input type="hidden" name="transactionIds" value={txn.id} />
                </li>
              ))}
              {selected.length === 0 ? <li>No transactions selected.</li> : null}
            </ul>
          </div>

          <label className="block text-sm">
            Client email
            <input name="email" defaultValue={account.email} className="mt-1 w-full border border-line rounded px-2 py-1" required />
          </label>

          <label className="block text-sm">
            Due date
            <input type="date" name="dueDate" className="mt-1 w-full border border-line rounded px-2 py-1" required defaultValue="2026-07-31" />
          </label>

          <label className="block text-sm">
            Message
            <textarea
              name="message"
              className="mt-1 w-full border border-line rounded px-2 py-1"
              defaultValue="Please upload the receipts and invoices for these transactions."
            />
          </label>

          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <fieldset className="border border-line rounded p-3">
              <legend className="px-1">Delivery channels</legend>
              <label className="block"><input type="checkbox" name="channels" value="email" defaultChecked /> Email</label>
              <label className="block"><input type="checkbox" name="channels" value="app" /> In-app</label>
            </fieldset>

            <fieldset className="border border-line rounded p-3">
              <legend className="px-1">Privacy</legend>
              <label className="block"><input type="radio" name="privacy" value="shared" defaultChecked /> Shared</label>
              <label className="block"><input type="radio" name="privacy" value="private" /> Private</label>
            </fieldset>
          </div>

          <button className="bg-green text-greenInk px-4 py-2 rounded-md font-semibold">Send request</button>
        </form>
      </section>
    </div>
  );
}
