import { NextResponse } from 'next/server';
import { ensureSeeded, getOrCreateMtdImportAccount } from '@/lib/repo';
import { mapToFreeAgentCategory, MTD_CATEGORIES } from '@/lib/mtdCategories';
import { applyMtdImportRule, assertOnlyApproveCanExplain } from '@/lib/safezone';
import { rankTransactionCandidates } from '@/lib/matching';
import type { Extraction, MatchInput, StatementLineItem } from '@/lib/types';

export async function POST(request: Request) {
  const db = ensureSeeded();
  const formData = await request.formData();
  const requestId = Number(formData.get('requestId'));

  const req = db
    .prepare(`SELECT id, clientId, periodEnd, loadedAt FROM paperwork_requests WHERE id = ? AND kind = 'mtd_quarterly'`)
    .get(requestId) as { id: number; clientId: number; periodEnd: string | null; loadedAt: string | null } | undefined;

  if (!req) {
    return NextResponse.json({ error: 'MTD request not found' }, { status: 404 });
  }

  if (req.loadedAt) {
    return NextResponse.redirect(new URL(`/mtd/requests/${req.id}/review`, request.url), 303);
  }

  const sourceDocument = db
    .prepare(
      `SELECT id, extractionJson FROM documents
       WHERE requestId = ? AND mtdSourceKind IN ('mtd_statement', 'mtd_csv') ORDER BY id DESC LIMIT 1`,
    )
    .get(req.id) as { id: number; extractionJson: string | null } | undefined;

  if (!sourceDocument) {
    return NextResponse.json(
      { error: 'A bank statement or MTD CSV must be uploaded before posting to the ledger' },
      { status: 400 },
    );
  }

  let lines: StatementLineItem[] = sourceDocument.extractionJson
    ? (JSON.parse(sourceDocument.extractionJson).lines ?? [])
    : [];

  if (lines.length === 0) {
    const figures = db
      .prepare('SELECT categoryKey, amount FROM mtd_figures WHERE requestId = ?')
      .all(req.id) as Array<{ categoryKey: string; amount: number }>;

    lines = figures.map((figure) => {
      const category = MTD_CATEGORIES.find((entry) => entry.key === figure.categoryKey);
      const signedAmount = category?.direction === 'income' ? figure.amount : -figure.amount;
      return {
        date: req.periodEnd ?? new Date().toISOString().slice(0, 10),
        description: category?.label ?? figure.categoryKey,
        amount: signedAmount,
        rawCategory: category?.label,
      };
    });
  }

  const accountId = getOrCreateMtdImportAccount(req.clientId);
  const now = new Date().toISOString();

  const insertTxn = db.prepare(
    `INSERT INTO transactions (
      accountId, date, merchant, rawDescription, amountIn, amountOut, status, category, description, approvedAt, mtdRequestId
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  for (const line of lines) {
    const category = mapToFreeAgentCategory(line.rawCategory ?? line.description);
    const applied = applyMtdImportRule(
      { id: 0, status: 'unexplained', category: null, description: null, documentId: null, attachmentNote: null },
      { category, description: line.description },
    );

    assertOnlyApproveCanExplain(applied.status, 'mtd_import_rule');

    insertTxn.run(
      accountId,
      line.date,
      line.description,
      line.description,
      line.amount > 0 ? line.amount : 0,
      line.amount < 0 ? -line.amount : 0,
      applied.status,
      applied.category,
      applied.description,
      now,
      req.id,
    );
  }

  const receipts = db
    .prepare(`SELECT id, extractionJson FROM documents WHERE requestId = ? AND mtdSourceKind = 'mtd_receipt'`)
    .all(req.id) as Array<{ id: number; extractionJson: string | null }>;

  if (receipts.length) {
    const candidates = db
      .prepare(
        `SELECT id, date, rawDescription, amountIn, amountOut, documentId FROM transactions WHERE mtdRequestId = ?`,
      )
      .all(req.id) as MatchInput[];

    for (const receipt of receipts) {
      if (!receipt.extractionJson) continue;
      const extraction = JSON.parse(receipt.extractionJson) as Extraction;
      const ranked = rankTransactionCandidates(extraction, candidates, 'fuzzy');
      const best = ranked[0];

      db.prepare(
        `UPDATE documents SET matchedTransactionId = ?, matchScore = ?, matchConfidence = ?, rankedCandidatesJson = ? WHERE id = ?`,
      ).run(
        best?.transactionId ?? null,
        best?.score ?? null,
        best?.confidence ?? null,
        ranked.length ? JSON.stringify(ranked) : null,
        receipt.id,
      );
    }
  }

  db.prepare(`UPDATE paperwork_requests SET status = 'loaded', loadedAt = ? WHERE id = ?`).run(now, req.id);

  return NextResponse.redirect(new URL(`/mtd/requests/${req.id}/review`, request.url), 303);
}
