import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { ensureSeeded, requestStatusFromItems } from '@/lib/repo';
import { extractDocument } from '@/lib/extraction';
import { rankTransactionCandidates } from '@/lib/matching';
import { createExplanationFromDocument } from '@/lib/safezone';
import type { Extraction, MatchInput } from '@/lib/types';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function POST(request: Request) {
  const db = ensureSeeded();
  const formData = await request.formData();

  const token = String(formData.get('token') ?? '');
  const requestItemId = Number(formData.get('requestItemId'));
  const file = formData.get('file');

  if (!token || !requestItemId || !(file instanceof File)) {
    return NextResponse.json({ error: 'Invalid upload payload' }, { status: 400 });
  }

  const req = db
    .prepare(
      `SELECT r.id, r.clientId, r.privacy, r.status, c.smartCaptureAllowance, c.smartCaptureUsed
       FROM paperwork_requests r
       JOIN clients c ON c.id = r.clientId
       WHERE r.token = ?`,
    )
    .get(token) as {
    id: number;
    clientId: number;
    privacy: 'shared' | 'private';
    status: string;
    smartCaptureAllowance: number;
    smartCaptureUsed: number;
  } | undefined;

  if (!req) {
    return NextResponse.json({ error: 'Upload link not found' }, { status: 404 });
  }

  const item = db
    .prepare('SELECT id, transactionId FROM request_items WHERE id = ? AND requestId = ?')
    .get(requestItemId, req.id) as { id: number; transactionId: number } | undefined;

  if (!item) {
    return NextResponse.json({ error: 'Request item not found' }, { status: 404 });
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  const savedName = `${Date.now()}-${sanitizeFilename(file.name || 'upload')}`;
  const fullPath = path.join(UPLOAD_DIR, savedName);
  fs.writeFileSync(fullPath, bytes);

  const remaining = req.smartCaptureAllowance - req.smartCaptureUsed;
  const quotaAvailable = remaining > 0;
  const uploadedAt = new Date().toISOString();

  let extraction: Extraction | null = null;
  let rankedCandidates: ReturnType<typeof rankTransactionCandidates> = [];
  let matchedTransactionId: number | null = null;
  let matchScore: number | null = null;
  let matchConfidence: string | null = null;

  if (quotaAvailable) {
    extraction = await extractDocument(bytes, file.type, file.name);

    if (extraction.documentType !== 'bank statement') {
      const candidates = db
        .prepare(
          `SELECT id, date, rawDescription, amountIn, amountOut, documentId
           FROM transactions
           WHERE accountId = (SELECT accountId FROM transactions WHERE id = ?)
           ORDER BY date DESC`,
        )
        .all(item.transactionId) as MatchInput[];

      rankedCandidates = rankTransactionCandidates(
        extraction,
        candidates,
        (process.env.MATCHING_STRATEGY as 'freeagent_rule' | 'fuzzy') ?? 'fuzzy',
      );

      if (rankedCandidates.length > 0) {
        const best = rankedCandidates[0];
        matchedTransactionId = best.transactionId;
        matchScore = best.score;
        matchConfidence = best.confidence;
      }
    }
  }

  const documentResult = db
    .prepare(
      `INSERT INTO documents (
        filename, mimeType, path, sizeBytes, requestId, uploadedBy, uploadedAt, privacy,
        quotaConsumed, extractionJson, matchedTransactionId, matchScore, matchConfidence, rankedCandidatesJson
      ) VALUES (?, ?, ?, ?, ?, 'client', ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      file.name,
      file.type || 'application/octet-stream',
      fullPath,
      bytes.byteLength,
      req.id,
      uploadedAt,
      req.privacy,
      quotaAvailable ? 1 : 0,
      extraction ? JSON.stringify(extraction) : null,
      matchedTransactionId,
      matchScore,
      matchConfidence,
      rankedCandidates.length ? JSON.stringify(rankedCandidates) : null,
    );

  const documentId = Number(documentResult.lastInsertRowid);

  db.prepare(`UPDATE request_items SET status = 'fulfilled', documentId = ? WHERE id = ?`).run(documentId, item.id);

  if (quotaAvailable) {
    db.prepare('UPDATE clients SET smartCaptureUsed = smartCaptureUsed + 1 WHERE id = ?').run(req.clientId);
  } else {
    db.prepare(`UPDATE paperwork_requests SET status = 'blocked_quota' WHERE id = ?`).run(req.id);
  }

  if (matchedTransactionId && extraction) {
    const txn = db
      .prepare('SELECT id, status, category, description, documentId, attachmentNote FROM transactions WHERE id = ?')
      .get(matchedTransactionId) as {
      id: number;
      status: 'unexplained' | 'for_approval' | 'explained' | 'manually_added';
      category: string | null;
      description: string | null;
      documentId: number | null;
      attachmentNote: string | null;
    };

    const next = createExplanationFromDocument(txn, {
      documentId,
      description: extraction.description,
      suggestedCategory: extraction.suggestedCategory,
      attachmentNote:
        extraction.documentType === 'bank statement'
          ? "We can't process statements yet — please send individual receipts."
          : 'Matched by Smart Capture prototype',
    });

    db.prepare(
      `UPDATE transactions
       SET status = ?, category = ?, description = ?, documentId = ?, attachmentNote = ?
       WHERE id = ?`,
    ).run(next.status, next.category ?? null, next.description ?? null, next.documentId ?? null, next.attachmentNote ?? null, next.id);
  }

  if (req.status !== 'blocked_quota') {
    const stats = db
      .prepare(
        `SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'fulfilled' THEN 1 ELSE 0 END) AS fulfilled
         FROM request_items WHERE requestId = ?`,
      )
      .get(req.id) as { total: number; fulfilled: number };
    const nextStatus = requestStatusFromItems(stats.total, stats.fulfilled || 0);
    db.prepare('UPDATE paperwork_requests SET status = ? WHERE id = ?').run(nextStatus, req.id);
  }

  return NextResponse.redirect(new URL(`/p/${token}`, request.url), 303);
}
