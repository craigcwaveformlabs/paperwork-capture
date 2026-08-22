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

export function assertOnlyApproveCanExplain(
  nextStatus: TransactionStatus,
  source: 'approve_route' | 'other',
) {
  if (nextStatus === 'explained' && source !== 'approve_route') {
    throw new Error("Only /api/approve may set status to 'explained'");
  }
}
