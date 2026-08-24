import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { StatusPill } from '@/components/StatusPill';
import { dateFmt } from '@/lib/format';
import { getSessionClientId, SESSION_COOKIE_NAME } from '@/lib/clientAuth';
import { ensureSeeded } from '@/lib/repo';
import type { RequestStatus } from '@/lib/types';

export default async function PortalHomePage({ params }: { params: Promise<{ portalToken: string }> }) {
  const { portalToken } = await params;
  const db = ensureSeeded();

  const client = db.prepare('SELECT id, name FROM clients WHERE portalToken = ?').get(portalToken) as
    | { id: number; name: string }
    | undefined;

  if (!client) {
    return <p>Portal link not found.</p>;
  }

  const cookieStore = await cookies();
  const sessionClientId = getSessionClientId(db, cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (sessionClientId !== client.id) {
    redirect(`/portal/${portalToken}`);
  }

  const paperworkRequests = db
    .prepare(
      `SELECT id, token, status, createdAt, dueDate FROM paperwork_requests
       WHERE clientId = ? AND kind = 'transaction' ORDER BY createdAt DESC`,
    )
    .all(client.id) as Array<{
    id: number;
    token: string;
    status: RequestStatus;
    createdAt: string;
    dueDate: string;
  }>;

  const mtdRequests = db
    .prepare(
      `SELECT id, status, createdAt, dueDate, quarterLabel FROM paperwork_requests
       WHERE clientId = ? AND kind = 'mtd_quarterly' ORDER BY createdAt DESC`,
    )
    .all(client.id) as Array<{
    id: number;
    status: RequestStatus;
    createdAt: string;
    dueDate: string;
    quarterLabel: string | null;
  }>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Welcome, {client.name}</h2>

      <section className="bg-white border border-line rounded-lg p-4">
        <h3 className="font-semibold mb-2">Paperwork requests</h3>
        {paperworkRequests.length === 0 ? (
          <p className="text-sm text-slate-600">Nothing outstanding.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {paperworkRequests.map((req) => (
              <li key={req.id} className="flex items-center justify-between gap-3 border-b border-line/60 pb-2">
                <span>Due {dateFmt(req.dueDate)}</span>
                <StatusPill value={req.status} />
                <Link href={`/p/${req.token}`}>Open</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white border border-line rounded-lg p-4">
        <h3 className="font-semibold mb-2">MTD quarterly capture</h3>
        {mtdRequests.length === 0 ? (
          <p className="text-sm text-slate-600">No MTD requests yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {mtdRequests.map((req) => (
              <li key={req.id} className="flex items-center justify-between gap-3 border-b border-line/60 pb-2">
                <span>{req.quarterLabel ?? 'Quarter'} · Due {dateFmt(req.dueDate)}</span>
                <StatusPill value={req.status} />
                <Link href={`/portal/${portalToken}/mtd/${req.id}`}>Open</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
