import Link from 'next/link';
import { StatusPill } from '@/components/StatusPill';
import { dateFmt, money } from '@/lib/format';
import { ensureSeeded, mtdRequestStatus } from '@/lib/repo';
import { mapToFreeAgentCategory } from '@/lib/mtdCategories';
import type { StatementLineItem } from '@/lib/types';

export default async function MtdReviewPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const db = ensureSeeded();

  const req = db
    .prepare(
      `SELECT r.id, r.clientId, r.dueDate, r.quarterLabel, r.periodStart, r.periodEnd, r.dataReceivedAt, r.loadedAt,
              c.name as clientName
       FROM paperwork_requests r JOIN clients c ON c.id = r.clientId
       WHERE r.id = ? AND r.kind = 'mtd_quarterly'`,
    )
    .get(requestId) as
    | {
        id: number;
        clientId: number;
        dueDate: string;
        quarterLabel: string | null;
        periodStart: string | null;
        periodEnd: string | null;
        dataReceivedAt: string | null;
        loadedAt: string | null;
        clientName: string;
      }
    | undefined;

  if (!req) {
    return <p>MTD request not found.</p>;
  }

  const sourceDocument = db
    .prepare(
      `SELECT id, filename, mtdSourceKind, extractionJson FROM documents
       WHERE requestId = ? AND mtdSourceKind IN ('mtd_statement', 'mtd_csv') ORDER BY id DESC LIMIT 1`,
    )
    .get(req.id) as { id: number; filename: string; mtdSourceKind: string; extractionJson: string | null } | undefined;

  const receipts = db
    .prepare(`SELECT id, filename FROM documents WHERE requestId = ? AND mtdSourceKind = 'mtd_receipt'`)
    .all(req.id) as Array<{ id: number; filename: string }>;

  const figures = db
    .prepare('SELECT categoryKey, amount FROM mtd_figures WHERE requestId = ?')
    .all(req.id) as Array<{ categoryKey: string; amount: number }>;

  const lines: StatementLineItem[] = sourceDocument?.extractionJson
    ? (JSON.parse(sourceDocument.extractionJson).lines ?? [])
    : [];

  const status = mtdRequestStatus({ dueDate: req.dueDate, dataReceivedAt: req.dataReceivedAt, loadedAt: req.loadedAt });

  return (
    <div className="space-y-4">
      <section className="bg-white border border-line rounded-lg p-4">
        <h2 className="font-semibold text-lg">{req.clientName} · {req.quarterLabel}</h2>
        <p className="text-sm text-slate-600">
          Period {dateFmt(req.periodStart ?? '')} – {dateFmt(req.periodEnd ?? '')} · Due {dateFmt(req.dueDate)}
        </p>
        <div className="mt-2"><StatusPill value={status} /></div>
      </section>

      <section className="bg-white border border-line rounded-lg p-4">
        <h3 className="font-semibold mb-2">Source document</h3>
        {sourceDocument ? (
          <p className="text-sm">
            {sourceDocument.filename} ({sourceDocument.mtdSourceKind})
          </p>
        ) : (
          <p className="text-sm text-red">
            No statement or CSV uploaded yet — posting is blocked until one arrives.
          </p>
        )}
      </section>

      {lines.length > 0 ? (
        <section className="bg-white border border-line rounded-lg overflow-hidden">
          <h3 className="font-semibold p-4 pb-0">Parsed transaction lines ({lines.length})</h3>
          <table className="w-full text-sm mt-2">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="p-3">Date</th>
                <th className="p-3">Description</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Category</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={index} className="border-b border-line/60">
                  <td className="p-3">{dateFmt(line.date)}</td>
                  <td className="p-3">{line.description}</td>
                  <td className="p-3">{money(line.amount)}</td>
                  <td className="p-3">{mapToFreeAgentCategory(line.rawCategory ?? line.description)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {figures.length > 0 ? (
        <section className="bg-white border border-line rounded-lg p-4">
          <h3 className="font-semibold mb-2">Manual category figures (fallback)</h3>
          <ul className="text-sm space-y-1">
            {figures.map((figure) => (
              <li key={figure.categoryKey}>
                {figure.categoryKey}: {money(figure.amount)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {receipts.length > 0 ? (
        <section className="bg-white border border-line rounded-lg p-4">
          <h3 className="font-semibold mb-2">Receipts ({receipts.length})</h3>
          <ul className="text-sm space-y-1">
            {receipts.map((doc) => (
              <li key={doc.id}>{doc.filename}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="bg-white border border-line rounded-lg p-4">
        {req.loadedAt ? (
          <p className="text-tick text-sm font-semibold">Posted to ledger ✓</p>
        ) : (
          <form action="/api/mtd/load" method="post">
            <input type="hidden" name="requestId" value={req.id} />
            <button
              className="bg-green text-greenInk px-4 py-2 rounded-md font-semibold disabled:opacity-50"
              disabled={!sourceDocument}
            >
              Post to ledger
            </button>
          </form>
        )}
      </section>

      <Link href={`/mtd/${req.clientId}`}>&larr; Back to {req.clientName}</Link>
    </div>
  );
}
