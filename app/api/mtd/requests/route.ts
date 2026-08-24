import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { ensureSeeded } from '@/lib/repo';
import { nextMtdPeriod } from '@/lib/mtdCategories';

export async function POST(request: Request) {
  const db = ensureSeeded();
  const formData = await request.formData();
  const clientId = Number(formData.get('clientId'));

  if (!clientId) {
    return NextResponse.json({ error: 'Missing clientId' }, { status: 400 });
  }

  const client = db.prepare('SELECT id, name, email, portalToken FROM clients WHERE id = ?').get(clientId) as
    | { id: number; name: string; email: string; portalToken: string | null }
    | undefined;

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const last = db
    .prepare(
      `SELECT periodEnd FROM paperwork_requests
       WHERE clientId = ? AND kind = 'mtd_quarterly' ORDER BY periodEnd DESC LIMIT 1`,
    )
    .get(clientId) as { periodEnd: string | null } | undefined;

  const today = new Date().toISOString().slice(0, 10);
  const period = nextMtdPeriod(today, last?.periodEnd ?? null);

  const token = crypto.randomBytes(24).toString('hex');
  const createdAt = new Date().toISOString();

  const result = db
    .prepare(
      `INSERT INTO paperwork_requests (
        clientId, token, createdAt, dueDate, message, channels, privacy, status, kind, periodStart, periodEnd, quarterLabel
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', 'mtd_quarterly', ?, ?, ?)`,
    )
    .run(
      clientId,
      token,
      createdAt,
      period.dueDate,
      `Please upload your bank statement (or MTD CSV) for ${period.quarterLabel}, plus any receipts.`,
      JSON.stringify(['email']),
      'shared',
      period.periodStart,
      period.periodEnd,
      period.quarterLabel,
    );

  const requestId = Number(result.lastInsertRowid);
  const uploadLink = client.portalToken ? `/portal/${client.portalToken}/mtd/${requestId}` : '/portal';

  db.prepare(
    `INSERT INTO outbox_messages (requestId, recipientEmail, subject, body, uploadLink, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    requestId,
    client.email,
    `MTD capture: ${period.quarterLabel}`,
    `Please upload your bank statement or MTD CSV for ${period.quarterLabel} (due ${period.dueDate}).\n\nUpload here: ${uploadLink}`,
    uploadLink,
    createdAt,
  );

  return NextResponse.redirect(new URL('/outbox', request.url), 303);
}
