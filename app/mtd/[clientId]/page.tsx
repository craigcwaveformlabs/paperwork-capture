import Link from 'next/link';
import { StatusPill } from '@/components/StatusPill';
import { dateFmt } from '@/lib/format';
import { ensureSeeded, mtdRequestStatus } from '@/lib/repo';
import { nextMtdPeriod } from '@/lib/mtdCategories';

export default async function MtdClientPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const db = ensureSeeded();

  const client = db.prepare('SELECT id, name FROM clients WHERE id = ?').get(clientId) as
    | { id: number; name: string }
    | undefined;

  if (!client) {
    return <p>Client not found.</p>;
  }

  const requests = db
    .prepare(
      `SELECT id, createdAt, dueDate, quarterLabel, periodEnd, dataReceivedAt, loadedAt
       FROM paperwork_requests WHERE clientId = ? AND kind = 'mtd_quarterly' ORDER BY createdAt DESC`,
    )
    .all(client.id) as Array<{
    id: number;
    createdAt: string;
    dueDate: string;
    quarterLabel: string | null;
    periodEnd: string | null;
    dataReceivedAt: string | null;
    loadedAt: string | null;
  }>;

  const displayed = requests.map((req) => ({
    ...req,
    status: mtdRequestStatus({ dueDate: req.dueDate, dataReceivedAt: req.dataReceivedAt, loadedAt: req.loadedAt }),
  }));

  const today = new Date().toISOString().slice(0, 10);
  const lastPeriodEnd = requests[0]?.periodEnd ?? null;
  const next = nextMtdPeriod(today, lastPeriodEnd);
  const alreadyRequested = requests.some((req) => req.periodEnd === next.periodEnd);

  return (
    <div className="space-y-4">
      <section className="bg-white border border-line rounded-lg p-4">
        <h2 className="font-semibold text-lg">{client.name} · MTD Quarterly Capture</h2>
        <form action="/api/mtd/requests" method="post" className="mt-3">
          <input type="hidden" name="clientId" value={client.id} />
          <button
            className="bg-blue text-white px-4 py-2 rounded-md font-semibold disabled:opacity-50"
            disabled={alreadyRequested}
          >
            {alreadyRequested
              ? `${next.quarterLabel} already requested`
              : `Request ${next.quarterLabel} (due ${dateFmt(next.dueDate)})`}
          </button>
        </form>
      </section>

      <section className="bg-white border border-line rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="p-3">Quarter</th>
              <th className="p-3">Requested</th>
              <th className="p-3">Due</th>
              <th className="p-3">Status</th>
              <th className="p-3">Review</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((req) => (
              <tr key={req.id} className="border-b border-line/60">
                <td className="p-3">{req.quarterLabel}</td>
                <td className="p-3">{dateFmt(req.createdAt)}</td>
                <td className="p-3">{dateFmt(req.dueDate)}</td>
                <td className="p-3"><StatusPill value={req.status} /></td>
                <td className="p-3"><Link href={`/mtd/requests/${req.id}/review`}>Open</Link></td>
              </tr>
            ))}
            {displayed.length === 0 ? (
              <tr>
                <td className="p-3 text-slate-600" colSpan={5}>
                  No MTD requests yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
