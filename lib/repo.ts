import { getDb } from './db';
import { seedDatabase } from './seed';
import type { RequestStatus } from './types';

export function ensureSeeded() {
  seedDatabase();
  return getDb();
}

export function requestStatusFromItems(total: number, fulfilled: number) {
  if (fulfilled === 0) return 'viewed';
  if (fulfilled >= total) return 'complete';
  return 'partial';
}

export function mtdRequestStatus(request: {
  dueDate: string;
  dataReceivedAt?: string | null;
  loadedAt?: string | null;
}): RequestStatus {
  if (request.loadedAt) return 'loaded';
  if (request.dataReceivedAt) return 'data_received';
  if (new Date(request.dueDate) < new Date()) return 'overdue';
  return 'sent';
}

/** Finds or creates the client's synthetic "MTD Import" bank account that posted MTD lines land in. */
export function getOrCreateMtdImportAccount(clientId: number): number {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM bank_accounts WHERE clientId = ? AND kind = 'mtd_import'")
    .get(clientId) as { id: number } | undefined;

  if (existing) {
    return existing.id;
  }

  const result = db
    .prepare("INSERT INTO bank_accounts (clientId, name, balance, kind) VALUES (?, 'MTD Import', 0, 'mtd_import')")
    .run(clientId);

  return Number(result.lastInsertRowid);
}
