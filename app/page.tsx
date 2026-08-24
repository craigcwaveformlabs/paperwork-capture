import Link from 'next/link';
import { StatusPill } from '@/components/StatusPill';
import { ensureSeeded } from '@/lib/repo';
import type { RequestStatus } from '@/lib/types';

export default function PracticeDashboard() {
  const db = ensureSeeded();

  const clients = db
    .prepare(
      `SELECT c.id, c.name, c.businessType,
        (SELECT a.id FROM bank_accounts a WHERE a.clientId = c.id AND a.kind = 'client' ORDER BY a.id LIMIT 1) as accountId,
        (SELECT status FROM paperwork_requests r WHERE r.clientId = c.id AND r.kind = 'transaction' ORDER BY r.createdAt DESC LIMIT 1) as paperworkStatus,
        (SELECT status FROM paperwork_requests r WHERE r.clientId = c.id AND r.kind = 'mtd_quarterly' ORDER BY r.createdAt DESC LIMIT 1) as mtdStatus
       FROM clients c
       ORDER BY c.name`,
    )
    .all() as Array<{
    id: number;
    name: string;
    businessType: string;
    accountId: number | null;
    paperworkStatus: RequestStatus | null;
    mtdStatus: RequestStatus | null;
  }>;

  return (
    <section className="bg-white border border-line rounded-lg overflow-hidden">
      <header className="p-4 border-b border-line">
        <h2 className="font-semibold text-lg">Practice dashboard</h2>
        <p className="text-sm text-slate-600 mt-1">
          Every client, with their Paperwork Request and MTD Quarterly Capture journeys side by side.
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="p-3">Client</th>
              <th className="p-3">Business type</th>
              <th className="p-3">Paperwork Request</th>
              <th className="p-3">MTD Capture</th>
              <th className="p-3">Open</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-line/60">
                <td className="p-3 font-medium">{client.name}</td>
                <td className="p-3">{client.businessType}</td>
                <td className="p-3">{client.paperworkStatus ? <StatusPill value={client.paperworkStatus} /> : '—'}</td>
                <td className="p-3">{client.mtdStatus ? <StatusPill value={client.mtdStatus} /> : '—'}</td>
                <td className="p-3 flex gap-3">
                  {client.accountId ? <Link href={`/banking/${client.accountId}`}>Banking</Link> : null}
                  <Link href={`/mtd/${client.id}`}>MTD</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
