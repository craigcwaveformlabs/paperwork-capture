import { NextResponse } from 'next/server';
import { ensureSeeded } from '@/lib/repo';
import { issuePasscode } from '@/lib/clientAuth';

export async function POST(request: Request) {
  const db = ensureSeeded();
  const formData = await request.formData();
  const portalToken = String(formData.get('portalToken') ?? '');

  const client = db.prepare('SELECT id, email FROM clients WHERE portalToken = ?').get(portalToken) as
    | { id: number; email: string }
    | undefined;

  if (!client) {
    return NextResponse.json({ error: 'Portal link not found' }, { status: 404 });
  }

  const passcode = issuePasscode(db, client.id);
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO outbox_messages (requestId, recipientEmail, subject, body, uploadLink, createdAt)
     VALUES (NULL, ?, ?, ?, ?, ?)`,
  ).run(
    client.email,
    'Your login code',
    `Your one-time login code is ${passcode}. It expires in 15 minutes.`,
    `/portal/${portalToken}`,
    now,
  );

  return NextResponse.redirect(new URL(`/portal/${portalToken}?requested=1`, request.url), 303);
}
