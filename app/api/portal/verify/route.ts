import { NextResponse } from 'next/server';
import { ensureSeeded } from '@/lib/repo';
import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS, verifyPasscode } from '@/lib/clientAuth';

export async function POST(request: Request) {
  const db = ensureSeeded();
  const formData = await request.formData();
  const portalToken = String(formData.get('portalToken') ?? '');
  const passcode = String(formData.get('passcode') ?? '').trim();

  const client = db.prepare('SELECT id FROM clients WHERE portalToken = ?').get(portalToken) as
    | { id: number }
    | undefined;

  if (!client) {
    return NextResponse.json({ error: 'Portal link not found' }, { status: 404 });
  }

  const token = verifyPasscode(db, client.id, passcode);
  if (!token) {
    return NextResponse.redirect(new URL(`/portal/${portalToken}?requested=1&error=1`, request.url), 303);
  }

  const response = NextResponse.redirect(new URL(`/portal/${portalToken}/home`, request.url), 303);
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  });
  return response;
}
