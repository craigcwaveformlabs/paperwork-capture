import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { StatusPill } from '@/components/StatusPill';
import { dateFmt } from '@/lib/format';
import { getSessionClientId, SESSION_COOKIE_NAME } from '@/lib/clientAuth';
import { MTD_CATEGORIES } from '@/lib/mtdCategories';
import { ensureSeeded, mtdRequestStatus } from '@/lib/repo';

export default async function PortalMtdCapturePage({
  params,
}: {
  params: Promise<{ portalToken: string; requestId: string }>;
}) {
  const { portalToken, requestId } = await params;
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

  const req = db
    .prepare(
      `SELECT id, clientId, quarterLabel, periodStart, periodEnd, dueDate, dataReceivedAt, loadedAt
       FROM paperwork_requests WHERE id = ? AND kind = 'mtd_quarterly'`,
    )
    .get(requestId) as
    | {
        id: number;
        clientId: number;
        quarterLabel: string | null;
        periodStart: string | null;
        periodEnd: string | null;
        dueDate: string;
        dataReceivedAt: string | null;
        loadedAt: string | null;
      }
    | undefined;

  if (!req || req.clientId !== client.id) {
    return <p>MTD request not found.</p>;
  }

  const sourceDocument = db
    .prepare(
      `SELECT id, filename, mtdSourceKind FROM documents
       WHERE requestId = ? AND mtdSourceKind IN ('mtd_statement', 'mtd_csv') ORDER BY id DESC LIMIT 1`,
    )
    .get(req.id) as { id: number; filename: string; mtdSourceKind: string } | undefined;

  const receipts = db
    .prepare(`SELECT id, filename FROM documents WHERE requestId = ? AND mtdSourceKind = 'mtd_receipt'`)
    .all(req.id) as Array<{ id: number; filename: string }>;

  const status = mtdRequestStatus({ dueDate: req.dueDate, dataReceivedAt: req.dataReceivedAt, loadedAt: req.loadedAt });

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <section className="bg-white border border-line rounded-lg p-4">
        <h2 className="text-lg font-semibold">{req.quarterLabel}</h2>
        <p className="text-sm text-slate-600">
          Period {dateFmt(req.periodStart ?? '')} – {dateFmt(req.periodEnd ?? '')} · Due {dateFmt(req.dueDate)}
        </p>
        <div className="mt-2">
          <StatusPill value={status} />
        </div>
      </section>

      <section className="bg-white border border-line rounded-lg p-4 space-y-2">
        <h3 className="font-semibold">Bank statement or MTD CSV (required)</h3>
        {sourceDocument ? (
          <p className="text-sm text-tick">Uploaded: {sourceDocument.filename} ✓</p>
        ) : (
          <form action="/api/mtd/evidence" method="post" encType="multipart/form-data" className="space-y-2">
            <input type="hidden" name="requestId" value={req.id} />
            <input type="hidden" name="kind" value="statement" />
            <input type="file" name="file" required accept=".pdf,.csv,application/pdf,text/csv" />
            <button className="bg-green text-greenInk px-3 py-2 rounded font-semibold">Upload statement/CSV</button>
          </form>
        )}
      </section>

      <section className="bg-white border border-line rounded-lg p-4 space-y-2">
        <h3 className="font-semibold">Receipts (optional)</h3>
        <ul className="text-sm space-y-1">
          {receipts.map((doc) => (
            <li key={doc.id}>{doc.filename} ✓</li>
          ))}
        </ul>
        <form action="/api/mtd/evidence" method="post" encType="multipart/form-data" className="space-y-2">
          <input type="hidden" name="requestId" value={req.id} />
          <input type="hidden" name="kind" value="receipt" />
          <input type="file" name="file" required accept="image/*,application/pdf" />
          <button className="border border-line text-blue px-3 py-2 rounded font-semibold">Upload receipt</button>
        </form>
      </section>

      <section className="bg-white border border-line rounded-lg p-4 space-y-2">
        <h3 className="font-semibold">Manual category figures (fallback only)</h3>
        <p className="text-xs text-slate-600">
          Use this only if you can&apos;t upload a statement or CSV. It doesn&apos;t replace the requirement above.
        </p>
        <form action="/api/mtd/figures" method="post" className="space-y-2">
          <input type="hidden" name="requestId" value={req.id} />
          {MTD_CATEGORIES.map((category) => (
            <label key={category.key} className="flex items-center justify-between text-sm gap-2">
              <span>{category.label}</span>
              <input
                type="number"
                step="0.01"
                name={category.key}
                className="border border-line rounded px-2 py-1 w-32 text-right"
              />
            </label>
          ))}
          <button className="border border-line text-blue px-3 py-2 rounded font-semibold w-full">Save figures</button>
        </form>
      </section>
    </div>
  );
}
