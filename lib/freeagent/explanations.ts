import { apiRequest } from './client';

const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
};

export type EvidenceFile = {
  fileName: string;
  buffer: Buffer;
};

export type ExplanationInput = {
  bank_transaction: string;
  dated_on: string;
  gross_value: number;
  category?: string;
  description?: string;
  sales_tax_rate?: string;
};

/** Builds the FreeAgent `attachment` payload shape, shared by explanations and invoice items. */
export function toAttachment(evidence: EvidenceFile): { data: string; file_name: string; content_type: string } {
  const ext = evidence.fileName.slice(evidence.fileName.lastIndexOf('.')).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    throw new Error(`Unsupported attachment type "${ext}" — FreeAgent accepts PNG/JPEG/GIF/PDF`);
  }
  if (evidence.buffer.length > 5 * 1024 * 1024) {
    throw new Error(`${evidence.fileName} is over FreeAgent's 5MB attachment limit`);
  }

  return {
    data: evidence.buffer.toString('base64'),
    file_name: evidence.fileName,
    content_type: contentType,
  };
}

/** Categorises (explains) a bank transaction, optionally attaching an evidence file. */
export function explainTransaction(explanation: ExplanationInput, evidence?: EvidenceFile) {
  const payload: Record<string, unknown> = { ...explanation };

  if (evidence) {
    payload.attachment = toAttachment(evidence);
  }

  return apiRequest('/bank_transaction_explanations', {
    method: 'POST',
    body: { bank_transaction_explanation: payload },
  });
}
