export type TransactionStatus = 'unexplained' | 'for_approval' | 'explained' | 'manually_added';

export type RequestStatus =
  | 'sent'
  | 'viewed'
  | 'partial'
  | 'complete'
  | 'overdue'
  | 'blocked_quota';

export type RequestPrivacy = 'shared' | 'private';

export type ExtractionConfidence = 'high' | 'medium' | 'low';

export type DocumentType = 'receipt' | 'invoice' | 'bank statement' | 'other';

export type SuggestedCategory =
  | 'Travel'
  | 'Accommodation and Meals'
  | 'Office Costs'
  | 'Sundries'
  | 'Cost of Sales'
  | 'Motor Expenses'
  | 'Subsistence'
  | 'Repairs and Maintenance'
  | 'Software'
  | 'Professional Fees'
  | 'Bank/Finance Charges'
  | 'Rent'
  | 'Insurance'
  | 'Rates'
  | 'Mobile Phone'
  | 'Internet & Telephone';

export type Extraction = {
  documentType: DocumentType;
  merchant: string;
  date: string;
  totalAmount: number;
  currency: string;
  vatAmount?: number | null;
  vatRate?: string | null;
  description: string;
  suggestedCategory: SuggestedCategory;
  extractionConfidence: ExtractionConfidence;
  notes: string;
};

export type MatchConfidence = 'high' | 'medium' | 'low';

export type MatchCandidate = {
  transactionId: number;
  score: number;
  confidence: MatchConfidence;
  reason: string;
};

export type MatchStrategy = 'freeagent_rule' | 'fuzzy';

export type MatchInput = {
  id: number;
  date: string;
  rawDescription: string;
  amountOut: number;
  amountIn: number;
  documentId?: number | null;
};
