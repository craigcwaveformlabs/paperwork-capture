import type { TransactionStatus } from './types';

export type SafeTransaction = {
  id: number;
  status: TransactionStatus;
  category?: string | null;
  description?: string | null;
  documentId?: number | null;
  attachmentNote?: string | null;
};

export function createExplanationFromDocument(
  transaction: SafeTransaction,
  params: {
    documentId: number;
    description: string;
    suggestedCategory?: string;
    attachmentNote?: string;
  },
): SafeTransaction {
  return {
    ...transaction,
    status: 'for_approval',
    documentId: params.documentId,
    description: params.description,
    category: params.suggestedCategory ?? transaction.category ?? null,
    attachmentNote: params.attachmentNote ?? 'Smart Capture match suggestion',
  };
}

/**
 * Rule-categorised MTD statement/CSV lines post as already-explained, unlike
 * `createExplanationFromDocument` (Smart Capture matches always land in for_approval).
 * This is a deliberate, narrow exception — see assertOnlyApproveCanExplain.
 */
export function applyMtdImportRule(
  transaction: SafeTransaction,
  params: {
    category: string;
    description: string;
  },
): SafeTransaction {
  return {
    ...transaction,
    status: 'explained',
    category: params.category,
    description: params.description,
    attachmentNote: 'Posted from MTD statement/CSV import',
  };
}

export function assertOnlyApproveCanExplain(
  nextStatus: TransactionStatus,
  source: 'approve_route' | 'mtd_import_rule' | 'other',
) {
  if (nextStatus === 'explained' && source !== 'approve_route' && source !== 'mtd_import_rule') {
    throw new Error("Only /api/approve may set status to 'explained'");
  }
}
