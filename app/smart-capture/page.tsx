import { ensureSeeded } from '@/lib/repo';
import { dateFmt, money } from '@/lib/format';

export default function SmartCapturePage() {
  const db = ensureSeeded();

  const docs = db
    .prepare(
      `SELECT d.id, d.filename, d.uploadedAt, d.matchedTransactionId, d.matchConfidence, d.extractionJson,
              t.merchant as matchedMerchant
       FROM documents d
       LEFT JOIN transactions t ON t.id = d.matchedTransactionId
       ORDER BY d.uploadedAt DESC`,
    )
    .all() as Array<{
    id: number;
    filename: string;
    uploadedAt: string;
    matchedTransactionId: number | null;
    matchConfidence: string | null;
    extractionJson: string | null;
    matchedMerchant: string | null;
  }>;

  const metrics = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM documents) AS processed,
        (SELECT COUNT(*) FROM documents WHERE extractionJson IS NULL) AS extractionFailures,
        (SELECT COUNT(*) FROM accuracy_events WHERE cleanAccept = 1) AS cleanAccepts,
        (SELECT COUNT(*) FROM accuracy_events) AS reviewed,
        (SELECT SUM(correctedAmount) FROM accuracy_events) AS correctedAmount,
        (SELECT SUM(correctedDate) FROM accuracy_events) AS correctedDate,
        (SELECT SUM(correctedTransaction) FROM accuracy_events) AS correctedTransaction,
        (SELECT SUM(correctedCategory) FROM accuracy_events) AS correctedCategory`,
    )
    .get() as {
    processed: number;
    extractionFailures: number;
    cleanAccepts: number;
    reviewed: number;
    correctedAmount: number | null;
    correctedDate: number | null;
    correctedTransaction: number | null;
    correctedCategory: number | null;
  };

  const firstTimeRight = metrics.reviewed > 0 ? Math.round((metrics.cleanAccepts / metrics.reviewed) * 100) : 0;

  return (
    <div className="space-y-4">
      <section className="bg-white border border-line rounded-lg p-4 text-sm">
        <h2 className="font-semibold text-lg mb-2">Accuracy metrics</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="border border-line rounded p-2">Documents processed: <strong>{metrics.processed}</strong></div>
          <div className="border border-line rounded p-2">Extraction failures: <strong>{metrics.extractionFailures}</strong></div>
          <div className="border border-line rounded p-2">Clean accepts: <strong>{metrics.cleanAccepts}</strong></div>
          <div className="border border-line rounded p-2">First-time-right: <strong>{firstTimeRight}%</strong></div>
        </div>
        <p className="mt-2 text-slate-700">Corrections — amount: {metrics.correctedAmount ?? 0}, date: {metrics.correctedDate ?? 0}, transaction: {metrics.correctedTransaction ?? 0}, category: {metrics.correctedCategory ?? 0}</p>
      </section>

      <section className="bg-white border border-line rounded-lg overflow-hidden">
        <header className="p-4 border-b border-line">
          <h3 className="font-semibold">Uploaded documents</h3>
        </header>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="p-3">File</th>
              <th className="p-3">Extracted date/value</th>
              <th className="p-3">Bank transaction</th>
              <th className="p-3">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => {
              const extraction = doc.extractionJson ? JSON.parse(doc.extractionJson) : null;
              return (
                <tr key={doc.id} className="border-b border-line/60">
                  <td className="p-3">{doc.filename}</td>
                  <td className="p-3">
                    {extraction ? `${dateFmt(extraction.date)} · ${money(Number(extraction.totalAmount ?? 0))}` : 'Not extracted (quota blocked or failure)'}
                  </td>
                  <td className="p-3">{doc.matchedTransactionId ? `${doc.matchedMerchant} (#${doc.matchedTransactionId})` : 'Unmatched'}</td>
                  <td className="p-3">{doc.matchConfidence ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
