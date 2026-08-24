import crypto from 'node:crypto';
import type Database from 'better-sqlite3';

export const SESSION_COOKIE_NAME = 'session_token';
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

const PASSCODE_TTL_MINUTES = 15;

function hashPasscode(passcode: string): string {
  return crypto.createHash('sha256').update(passcode).digest('hex');
}

export function generatePasscode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

/** Generates and stores a fresh passcode for the client, replacing any prior one. Returns the raw passcode to send. */
export function issuePasscode(db: Database.Database, clientId: number): string {
  const passcode = generatePasscode();
  const passcodeHash = hashPasscode(passcode);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + PASSCODE_TTL_MINUTES * 60_000).toISOString();

  const existing = db.prepare('SELECT id FROM client_accounts WHERE clientId = ?').get(clientId) as
    | { id: number }
    | undefined;

  if (existing) {
    db.prepare('UPDATE client_accounts SET passcodeHash = ?, passcodeExpiresAt = ? WHERE id = ?').run(
      passcodeHash,
      expiresAt,
      existing.id,
    );
  } else {
    db.prepare(
      'INSERT INTO client_accounts (clientId, passcodeHash, passcodeExpiresAt, createdAt) VALUES (?, ?, ?, ?)',
    ).run(clientId, passcodeHash, expiresAt, now);
  }

  return passcode;
}

/** Verifies a passcode, and on success creates a session and returns its token. Returns null on any mismatch/expiry. */
export function verifyPasscode(db: Database.Database, clientId: number, passcode: string): string | null {
  const account = db
    .prepare('SELECT id, passcodeHash, passcodeExpiresAt FROM client_accounts WHERE clientId = ?')
    .get(clientId) as { id: number; passcodeHash: string | null; passcodeExpiresAt: string | null } | undefined;

  if (!account || !account.passcodeHash || !account.passcodeExpiresAt) {
    return null;
  }
  if (new Date(account.passcodeExpiresAt) < new Date()) {
    return null;
  }
  if (hashPasscode(passcode) !== account.passcodeHash) {
    return null;
  }

  const now = new Date().toISOString();
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();

  db.prepare(
    'INSERT INTO client_sessions (clientAccountId, token, createdAt, expiresAt) VALUES (?, ?, ?, ?)',
  ).run(account.id, token, now, expiresAt);

  db.prepare('UPDATE client_accounts SET passcodeHash = NULL, passcodeExpiresAt = NULL, lastLoginAt = ? WHERE id = ?').run(
    now,
    account.id,
  );

  return token;
}

/** Resolves a session token to its owning clientId, or null if missing/expired. */
export function getSessionClientId(db: Database.Database, token: string | undefined | null): number | null {
  if (!token) {
    return null;
  }

  const row = db
    .prepare(
      `SELECT ca.clientId as clientId, cs.expiresAt as expiresAt
       FROM client_sessions cs
       JOIN client_accounts ca ON ca.id = cs.clientAccountId
       WHERE cs.token = ?`,
    )
    .get(token) as { clientId: number; expiresAt: string } | undefined;

  if (!row || new Date(row.expiresAt) < new Date()) {
    return null;
  }

  return row.clientId;
}

export function parseCookieHeader(header: string | null, name: string): string | undefined {
  if (!header) {
    return undefined;
  }
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      return rest.join('=');
    }
  }
  return undefined;
}

/** Resolves the signed-in clientId for an API route request, reading the session cookie from its headers. */
export function getSessionClientIdFromRequest(db: Database.Database, request: Request): number | null {
  const token = parseCookieHeader(request.headers.get('cookie'), SESSION_COOKIE_NAME);
  return getSessionClientId(db, token);
}
