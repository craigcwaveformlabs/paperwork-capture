import fs from 'fs';
import path from 'path';

const LAST_UPLOAD_FILE = path.join(process.cwd(), 'data', 'mtd-last-upload.json');

export type LastUpload = {
  fileName: string;
  fileBase64: string;
  uploadedAt: string;
};

export function saveLastUpload(fileName: string, buffer: Buffer): void {
  const record: LastUpload = { fileName, fileBase64: buffer.toString('base64'), uploadedAt: new Date().toISOString() };
  fs.mkdirSync(path.dirname(LAST_UPLOAD_FILE), { recursive: true });
  fs.writeFileSync(LAST_UPLOAD_FILE, JSON.stringify(record, null, 2));
}

export function loadLastUpload(): LastUpload | null {
  if (!fs.existsSync(LAST_UPLOAD_FILE)) return null;
  return JSON.parse(fs.readFileSync(LAST_UPLOAD_FILE, 'utf8'));
}
