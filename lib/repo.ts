import { getDb } from './db';
import { seedDatabase } from './seed';

export function ensureSeeded() {
  seedDatabase();
  return getDb();
}

export function requestStatusFromItems(total: number, fulfilled: number) {
  if (fulfilled === 0) return 'viewed';
  if (fulfilled >= total) return 'complete';
  return 'partial';
}
