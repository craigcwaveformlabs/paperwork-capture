import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { ensureSeeded } from '@/lib/repo';
import { extractDocument, extractStatementLines } from '@/lib/extraction';
import { parseMtdCsv } from '@/lib/mtdCsv';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function POST(request: Request) {
  const db = ensureSeeded();
  const formData = await request.formData();

  const requestId = Number(formData.get('requestId'));
  const kind = String(formData.get('kind') ?? '');
  const file = formData.get('file');

  if (!requestId || !(file instanceof File) || (kind !== 'statement' && kind !== 'receipt')) {
    return NextResponse.json({ error: 'Invalid upload payload' }, { status: 400 });
  }

  const req = db
    .prepare(
      `SELECT r.id, r.privacy, c.portalToken FROM paperwork_requests r
       JOIN clients c ON c.id = r.clientId
       WHERE r.id = ? AND r.kind = 'mtd_quarterly'`,
    )
    .get(requestId) as { id: number; privacy: string; portalToken: string | null } | undefined;

  if (!req) {
    return NextResponse.json({ error: 'MTD request not found' }, { status: 404 });
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  const savedName = `${Date.now()}-${sanitizeFilename(file.name || 'upload')}`;
  const fullPath = path.join(UPLOAD_DIR, savedName);
  fs.writeFileSync(fullPath, bytes);

  const uploadedAt = new Date().toISOString();
  let mtdSourceKind: 'mtd_statement' | 'mtd_csv' | 'mtd_receipt' = 'mtd_receipt';
  let extractionJson: string | null = null;

  if (kind === 'statement') {
    const isCsv = file.type.includes('csv') || file.name.toLowerCase().endsWith('.csv');
    if (isCsv) {
      mtdSourceKind = 'mtd_csv';
      const lines = parseMtdCsv(bytes.toString('utf8'));
      extractionJson = JSON.stringify({ lines });
    } else {
      mtdSourceKind = 'mtd_statement';
      const lines = await extractStatementLines(bytes, file.type, file.name);
      extractionJson = JSON.stringify({ lines });
    }
  } else {
    const extraction = await extractDocument(bytes, file.type, file.name);
    extractionJson = JSON.stringify(extraction);
  }

  db.prepare(
    `INSERT INTO documents (
      filename, mimeType, path, sizeBytes, requestId, uploadedBy, uploadedAt, privacy,
      quotaConsumed, extractionJson, mtdSourceKind
    ) VALUES (?, ?, ?, ?, ?, 'client', ?, ?, 0, ?, ?)`,
  ).run(
    file.name,
    file.type || 'application/octet-stream',
    fullPath,
    bytes.byteLength,
    req.id,
    uploadedAt,
    req.privacy,
    extractionJson,
    mtdSourceKind,
  );

  if (kind === 'statement') {
    db.prepare(`UPDATE paperwork_requests SET status = 'data_received', dataReceivedAt = ? WHERE id = ?`).run(
      uploadedAt,
      req.id,
    );
  }

  return NextResponse.redirect(new URL(`/portal/${req.portalToken ?? ''}/mtd/${req.id}`, request.url), 303);
}
