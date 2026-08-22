import Link from 'next/link';
import { StatusPill } from '@/components/StatusPill';
import { dateFmt, daysOutstanding } from '@/lib/format';
import { ensureSeeded } from '@/lib/repo';
import type { RequestStatus } from '@/lib/types';

const tabs: Array<{ key: 'all' | RequestStatus; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'sent', label: 'Sent' },
  { key: 'viewed', label: 'Viewed' },
  { key: 'partial', label: 'Partial' },
  { key: 'complete', label: 'Complete' },
  { key: 'blocked_quota', label: 'Blocked quota' },
];

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = 'all' } = await searchParams;
  const db = ensureSeeded();

  const requests = db
    .prepare(
      `SELECT r.id, r.clientId, r.createdAt, r.status, r.token, c.name as clientName,
              (SELECT COUNT(*) FROM request_items i WHERE i.requestId = r.id) AS total,
              (SELECT COUNT(*) FROM request_items i WHERE i.requestId = r.id AND i.status = 'fulfilled') AS received
       FROM paperwork_requests r
       JOIN clients c ON c.id = r.clientId
       ORDER BY r.createdAt DESC`,
    )
    .all() as Array<{
    id: number;
    clientId: number;
    createdAt: string;
    status: RequestStatus;
    token: string;
    clientName: string;
    total: number;
    received: number;
  }>;

  const counts = requests.reduce(
    (acc, req) => {
      acc.all += 1;
      acc[req.status] += 1;
      return acc;
    },
    { all: 0, sent: 0, viewed: 0, partial: 0, complete: 0, overdue: 0, blocked_quota: 0 },
  );

  const filtered = tab === 'all' ? requests : requests.filter((req) => req.status === tab);

  return (
    <section className="bg-white border border-line rounded-lg overflow-hidden">
      <header className="p-4 border-b border-line">
        <h2 className="font-semibold text-lg">Paperwork requests</h2>
        <div className="flex gap-2 flex-wrap mt-3 text-sm">
          {tabs.map((entry) => (
            <Link
              key={entry.key}
              href={`/requests?tab=${entry.key}`}
              className={`px-3 py-1 rounded-full border ${tab === entry.key ? 'bg-blue text-white border-blue' : 'bg-white border-line text-blue'}`}
            >
              {entry.label} ({counts[entry.key]})
            </Link>
          ))}
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="p-3">Client</th>
              <th className="p-3">Requested</th>
              <th className="p-3">Received</th>
              <th className="p-3">Status</th>
              <th className="p-3">Days outstanding</th>
              <th className="p-3">Chase</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((req) => (
              <tr key={req.id} className="border-b border-line/60">
                <td className="p-3">{req.clientName}</td>
                <td className="p-3">{dateFmt(req.createdAt)}</td>
                <td className="p-3">{req.received} / {req.total}</td>
                <td className="p-3"><StatusPill value={req.status} /></td>
                <td className="p-3">{daysOutstanding(req.createdAt)}</td>
                <td className="p-3"><Link href={`/p/${req.token}`}>Open client link</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
