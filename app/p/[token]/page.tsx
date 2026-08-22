import { ensureSeeded, requestStatusFromItems } from '@/lib/repo';
import { dateFmt, money } from '@/lib/format';

export default async function ClientUploadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = ensureSeeded();

  const req = db
    .prepare(
      `SELECT r.id, r.clientId, r.createdAt, r.dueDate, r.message, r.privacy, r.status, r.viewedAt,
              c.name as clientName, c.smartCaptureAllowance, c.smartCaptureUsed
       FROM paperwork_requests r
       JOIN clients c ON c.id = r.clientId
       WHERE r.token = ?`,
    )
    .get(token) as {
    id: number;
    clientId: number;
    createdAt: string;
    dueDate: string;
    message: string;
    privacy: 'shared' | 'private';
    status: string;
    viewedAt: string | null;
    clientName: string;
    smartCaptureAllowance: number;
    smartCaptureUsed: number;
  } | undefined;

  if (!req) {
    return <p>Upload link not found.</p>;
  }

  if (!req.viewedAt) {
    db.prepare(`UPDATE paperwork_requests SET viewedAt = ?, status = 'viewed' WHERE id = ?`).run(
      new Date().toISOString(),
      req.id,
    );
  }

  const items = db
    .prepare(
      `SELECT i.id, i.transactionId, i.status, i.documentId, t.date, t.merchant, t.amountOut
       FROM request_items i
       JOIN transactions t ON t.id = i.transactionId
       WHERE i.requestId = ? ORDER BY t.date DESC`,
    )
    .all(req.id) as Array<{
    id: number;
    transactionId: number;
    status: 'pending' | 'fulfilled';
    documentId: number | null;
    date: string;
    merchant: string;
    amountOut: number;
  }>;

  const fulfilled = items.filter((item) => item.status === 'fulfilled').length;
  const remaining = req.smartCaptureAllowance - req.smartCaptureUsed;

  const nextStatus = requestStatusFromItems(items.length, fulfilled);
  if (req.status !== 'blocked_quota' && req.status !== nextStatus) {
    db.prepare('UPDATE paperwork_requests SET status = ? WHERE id = ?').run(nextStatus, req.id);
  }

  return (
    <div className="max-w-xl mx-auto bg-white border border-line rounded-lg p-4 space-y-4">
      <h2 className="text-lg font-semibold">Upload requested paperwork</h2>
      <p className="text-sm">For {req.clientName}. Due {dateFmt(req.dueDate)}. Privacy: {req.privacy}.</p>
      <p className="text-sm">{req.message}</p>
      <p className="text-sm text-slate-700">Progress: {fulfilled} of {items.length} provided · Smart Capture remaining: {remaining}</p>
      <p className="text-xs text-slate-600">Hint: take photos in bright light and keep the whole receipt in frame.</p>

      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="border border-line rounded p-3 text-sm">
            <div className="font-medium">{item.merchant}</div>
            <div>{dateFmt(item.date)} · {money(item.amountOut)}</div>
            {item.documentId ? (
              <p className="text-tick mt-2">Uploaded ✓</p>
            ) : (
              <form action="/api/upload" method="post" encType="multipart/form-data" className="mt-2 space-y-2">
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="requestItemId" value={item.id} />
                <input type="hidden" name="transactionId" value={item.transactionId} />
                <input type="file" name="file" required accept="image/*,application/pdf" />
                <button className="bg-green text-greenInk px-3 py-1 rounded font-semibold">Upload file</button>
              </form>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
