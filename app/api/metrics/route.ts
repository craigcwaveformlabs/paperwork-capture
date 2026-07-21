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

  return NextResponse.json({
    ...metrics,
    firstTimeRight,
  });
}
