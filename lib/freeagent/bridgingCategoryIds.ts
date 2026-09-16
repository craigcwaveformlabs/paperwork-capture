import fs from 'fs';
import path from 'path';

const TRACKED_IDS_FILE = path.join(process.cwd(), 'data', 'bridging-category-ids.json');

/**
 * Nominal codes of categories created/renamed through this app's Categories CRUD UI.
 * Needed because FreeAgent's category "id" is its nominal_code, which can change on
 * edit, and because we can't rely on the (user-editable) description to identify which
 * categories belong on this page once it no longer starts with "bridging-".
 */
function loadTrackedIds(): string[] {
  if (!fs.existsSync(TRACKED_IDS_FILE)) return [];
  return JSON.parse(fs.readFileSync(TRACKED_IDS_FILE, 'utf8'));
}

function saveTrackedIds(ids: string[]): void {
  fs.mkdirSync(path.dirname(TRACKED_IDS_FILE), { recursive: true });
  fs.writeFileSync(TRACKED_IDS_FILE, JSON.stringify(ids, null, 2));
}

export function getTrackedCategoryIds(): string[] {
  return loadTrackedIds();
}

export function addTrackedCategoryId(id: string): void {
  const ids = loadTrackedIds();
  if (!ids.includes(id)) saveTrackedIds([...ids, id]);
}

export function removeTrackedCategoryId(id: string): void {
  const ids = loadTrackedIds();
  saveTrackedIds(ids.filter((existing) => existing !== id));
}

export function renameTrackedCategoryId(oldId: string, newId: string): void {
  if (oldId === newId) {
    addTrackedCategoryId(newId);
    return;
  }
  const ids = loadTrackedIds().filter((existing) => existing !== oldId);
  ids.push(newId);
  saveTrackedIds(ids);
}
