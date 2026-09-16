import { isConnected } from '@/lib/freeagent/client';
import { listBankAccounts, listBankTransactions } from '@/lib/freeagent/statement';

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  if (!isConnected()) {
    return (
      <section className="bg-white border border-line rounded-lg p-4">
        <p className="text-sm">
          Not connected yet — go to <a href="/" className="text-link underline">Live FreeAgent</a> and connect first.
        </p>
      </section>
    );
  }

  const { account } = await searchParams;
  const bankAccounts = await listBankAccounts();
  const selectedAccount = account || bankAccounts[0]?.url;

  const transactions = selectedAccount ? await listBankTransactions(selectedAccount) : [];
  const sorted = [...transactions].sort((a, b) => (a.dated_on < b.dated_on ? 1 : -1));

  return (
    <section className="bg-white border border-line rounded-lg overflow-hidden">
      <header className="p-4 border-b border-line flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-lg">Transactions</h2>
          <p className="text-sm text-slate-600 mt-1">Bank transactions pulled live from your FreeAgent account.</p>
        </div>
        <form method="GET" className="flex items-center gap-2">
          <select name="account" defaultValue={selectedAccount} className="border border-line rounded px-3 py-2 text-sm">
            {bankAccounts.map((acc) => (
              <option key={acc.url} value={acc.url}>
                {acc.name ?? acc.url}
              </option>
            ))}
          </select>
          <button type="submit" className="bg-blue text-white text-sm font-medium px-3 py-2 rounded">
            View
          </button>
        </form>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="p-3">Date</th>
              <th className="p-3">Description</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => (
              <tr key={t.url} className="border-b border-line/60">
                <td className="p-3">{t.dated_on}</td>
                <td className="p-3">{t.description}</td>
                <td className="p-3 font-mono">{Number(t.amount).toFixed(2)}</td>
                <td className="p-3">
                  {Number(t.unexplained_amount) === 0 ? (
                    <span className="text-tick">Explained</span>
                  ) : (
                    <span className="text-orange">Unexplained</span>
                  )}
                </td>
              </tr>
            ))}
            {sorted.length === 0 ? (
              <tr>
                <td className="p-3 text-slate-400" colSpan={4}>
                  No transactions found for this account.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
