import fs from 'fs';
import path from 'path';
import { apiRequest } from './client.js';

const CONTENT_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
};

/**
 * Categorises (explains) a bank transaction, optionally attaching a receipt.
 * @param {{bank_transaction: string, dated_on: string, gross_value: number, category?: string, description?: string}} explanation
 * @param {string} [receiptPath] - PNG/JPEG/GIF/PDF, max 5MB (FreeAgent's current limit)
 */
export function explainTransaction(explanation, receiptPath) {
  const payload = { ...explanation };

  if (receiptPath) {
    const ext = path.extname(receiptPath).toLowerCase();
    const contentType = CONTENT_TYPES[ext];
    if (!contentType) {
      throw new Error(`Unsupported attachment type "${ext}" — FreeAgent accepts PNG/JPEG/GIF/PDF`);
    }

    const buffer = fs.readFileSync(receiptPath);
    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error(`${receiptPath} is over FreeAgent's 5MB attachment limit`);
    }

    payload.attachment = {
      data: buffer.toString('base64'),
      file_name: path.basename(receiptPath),
      content_type: contentType,
    };
  }

  return apiRequest('/bank_transaction_explanations', {
    method: 'POST',
    body: { bank_transaction_explanation: payload },
  });
}
