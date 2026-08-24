import { NextResponse } from 'next/server';
import { ensureSeeded } from '@/lib/repo';

export function GET() {
  const db = ensureSeeded();
  const metrics = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM documents) AS documentsProcessed,
        (SELECT COUNT(*) FROM documents WHERE extractionJson IS NULL) AS extractionFailures,
        (SELECT COUNT(*) FROM accuracy_events WHERE cleanAccept = 1) AS cleanAccepts,
        (SELECT COUNT(*) FROM accuracy_events) AS reviewed,
        (SELECT SUM(correctedAmount) FROM accuracy_events) AS correctedAmount,
        (SELECT SUM(correctedDate) FROM accuracy_events) AS correctedDate,
        (SELECT SUM(correctedTransaction) FROM accuracy_events) AS correctedTransaction,
        (SELECT SUM(correctedCategory) FROM accuracy_events) AS correctedCategory`,
    )
    .get() as {
    documentsProcessed: number;
    extractionFailures: number;
    cleanAccepts: number;
    reviewed: number;
    correctedAmount: number | null;
    correctedDate: number | null;
    correctedTransaction: number | null;
    correctedCategory: number | null;
  };

  const firstTimeRight = metrics.reviewed > 0 ? metrics.cleanAccepts / metrics.reviewed : 0;

  const mtd = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM paperwork_requests WHERE kind = 'mtd_quarterly') AS totalMtdRequests,
        (SELECT COUNT(*) FROM paperwork_requests WHERE kind = 'mtd_quarterly' AND loadedAt IS NOT NULL) AS mtdRequestsLoaded,
        (SELECT COUNT(DISTINCT r.id) FROM paperwork_requests r
          JOIN documents d ON d.requestId = r.id AND d.mtdSourceKind IN ('mtd_statement', 'mtd_csv')
          WHERE r.kind = 'mtd_quarterly') AS mtdRequestsWithSourceDocument,
        (SELECT COUNT(*) FROM transactions WHERE mtdRequestId IS NOT NULL) AS mtdTransactionsPosted,
        (SELECT COUNT(*) FROM mtd_figures) AS mtdManualFigureEntries`,
    )
    .get() as {
    totalMtdRequests: number;
    mtdRequestsLoaded: number;
    mtdRequestsWithSourceDocument: number;
    mtdTransactionsPosted: number;
    mtdManualFigureEntries: number;
  };

  const mtdSourceDocumentComplianceRate =
    mtd.totalMtdRequests > 0 ? mtd.mtdRequestsWithSourceDocument / mtd.totalMtdRequests : 0;

  return NextResponse.json({
    ...metrics,
    firstTimeRight,
    mtd: {
      ...mtd,
      sourceDocumentComplianceRate: mtdSourceDocumentComplianceRate,
    },
  });
}
