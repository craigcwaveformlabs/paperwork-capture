import Link from 'next/link';
import { StatusPill } from '@/components/StatusPill';
import { ensureSeeded } from '@/lib/repo';
import { dateFmt, money } from '@/lib/format';
import type { TransactionStatus } from '@/lib/types';

const tabs: Array<{ key: 'all' | TransactionStatus; label: string }> = [
  { key: 'all', label: 'All transactions' },
  { key: 'unexplained', label: 'Unexplained' },
  { key: 'for_approval', label: 'For approval' },
  { key: 'manually_added', label: 'Manually added' },
];

export default async function BankingPage({
  params,
  searchParams,
}: {
  params: Promise<{ accountId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { accountId } = await params;
  const { tab = 'all' } = await searchParams;
  const db = ensureSeeded();

  const account = db
    .prepare(
      `SELECT a.id, a.name, c.name as clientName
       FROM bank_accounts a JOIN clients c ON c.id = a.clientId WHERE a.id = ?`,
    )
    .get(accountId) as { id: number; name: string; clientName: string } | undefined;

  if (!account) {
    return <p>Bank account not found.</p>;
  }

  const all = db
    .prepare(
      `SELECT id, date, merchant, rawDescription, amountIn, amountOut, status, category, description, documentId
       FROM transactions WHERE accountId = ? ORDER BY date DESC, id DESC`,
    )
    .all(accountId) as Array<{
    id: number;
    date: string;
    merchant: string;
    rawDescription: string;
    amountIn: number;
    amountOut: number;
    status: TransactionStatus;
    category: string | null;
    description: string | null;
    documentId: number | null;
  }>;

  const counts = all.reduce(
    (acc, txn) => {
      acc.all += 1;
      acc[txn.status] += 1;
      return acc;
    },
    { all: 0, unexplained: 0, for_approval: 0, explained: 0, manually_added: 0 },
  );

  const filtered = tab === 'all' ? all : all.filter((txn) => txn.status === tab);

  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-4">
      <section className="bg-white border border-line rounded-lg overflow-hidden">
        <header className="border-b border-line p-4">
          <h2 className="font-semibold">{account.clientName} · {account.name}</h2>
          <div className="flex gap-2 mt-3 flex-wrap text-sm">
            {tabs.map((entry) => (
              <Link
                key={entry.key}
                href={`/banking/${accountId}?tab=${entry.key}`}
                className={`px-3 py-1 rounded-full border ${tab === entry.key ? 'bg-blue text-white border-blue' : 'bg-white border-line text-blue'}`}
              >
                {entry.label} ({counts[entry.key]})
              </Link>
            ))}
          </div>
        </header>

        <form action={`/banking/${accountId}/request`} className="p-3 space-y-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left">
                <tr className="border-b border-line">
                  <th className="py-2" />
                  <th>Date</th>
                  <th>Merchant</th>
                  <th>Money out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((txn) => (
                  <tr key={txn.id} className="border-b border-line/60 align-top">
                    <td className="py-2 pr-2"><input name="ids" type="checkbox" value={txn.id} /></td>
                    <td className="py-2 whitespace-nowrap">{dateFmt(txn.date)}</td>
                    <td className="py-2">
                      <div className="font-medium">{txn.merchant}</div>
                      <details className="text-xs text-slate-600">
                        <summary>Explanation</summary>
                        <div>{txn.description ?? 'No explanation yet'}</div>
                        <div>Category: {txn.category ?? '—'}</div>
                        <div>Attachment: {txn.documentId ? `Document #${txn.documentId}` : 'None'}</div>
                      </details>
                    </td>
                    <td className="py-2">{txn.amountOut > 0 ? money(txn.amountOut) : '—'}</td>
                    <td className="py-2"><StatusPill value={txn.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="border border-line text-blue px-4 py-2 rounded-md">Request paperwork for selected transactions</button>
        </form>
      </section>

      <aside className="bg-white border border-line rounded-lg p-4 h-fit">
        <h3 className="font-semibold mb-2">Request paperwork</h3>
        <p className="text-sm text-slate-700">
          Select unexplained transactions and send a paperwork request. Uploaded documents will be extracted,
          matched, and moved to For approval before any explanation is marked explained.
        </p>
        <form method="post" action="/api/approve" className="mt-4 space-y-2">
          <p className="text-sm font-medium">Approve {counts.for_approval} explanations</p>
          {all
            .filter((txn) => txn.status === 'for_approval')
            .map((txn) => (
              <label key={txn.id} className="block text-xs">
                <input type="checkbox" name="transactionIds" value={txn.id} defaultChecked /> {txn.merchant}
              </label>
            ))}
          <button className="bg-green text-greenInk px-3 py-1 rounded text-sm font-semibold">
            Approve &amp; save changes
          </button>
        </form>
      </aside>
    </div>
  );
}
