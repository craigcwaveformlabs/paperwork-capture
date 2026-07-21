import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { ensureSeeded } from '@/lib/repo';

export async function POST(request: Request) {
  const db = ensureSeeded();
  const formData = await request.formData();

  const accountId = Number(formData.get('accountId'));
  const clientId = Number(formData.get('clientId'));
  const email = String(formData.get('email') ?? '');
  const dueDate = String(formData.get('dueDate') ?? '');
  const message = String(formData.get('message') ?? '');
  const privacy = String(formData.get('privacy') ?? 'shared');
  const channels = formData.getAll('channels').map((entry) => String(entry));
  const transactionIds = formData.getAll('transactionIds').map((entry) => Number(entry)).filter(Boolean);

  if (!accountId || !clientId || !transactionIds.length) {
    return NextResponse.json({ error: 'Missing request details' }, { status: 400 });
  }

  const token = crypto.randomBytes(24).toString('hex');
  const createdAt = new Date().toISOString();

  const requestResult = db
    .prepare(
      `INSERT INTO paperwork_requests (clientId, token, createdAt, dueDate, message, channels, privacy, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'sent')`,
    )
    .run(clientId, token, createdAt, dueDate, message, JSON.stringify(channels), privacy);

  const requestId = Number(requestResult.lastInsertRowid);

  const insertItem = db.prepare(
    `INSERT INTO request_items (requestId, transactionId, status) VALUES (?, ?, 'pending')`,
  );
  for (const transactionId of transactionIds) {
    insertItem.run(requestId, transactionId);
  }

  const uploadLink = `/p/${token}`;
  db.prepare(
    `INSERT INTO outbox_messages (requestId, recipientEmail, subject, body, uploadLink, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    requestId,
    email,
    'Please upload your paperwork',
    `${message}\n\nUpload files: ${uploadLink}`,
    uploadLink,
    createdAt,
  );

  return NextResponse.redirect(new URL('/outbox', request.url));
}
