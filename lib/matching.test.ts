import { describe, expect, it } from 'vitest';
import { matchWithFreeAgentRule, rankTransactionCandidates } from './matching';
import type { Extraction, MatchInput } from './types';

const baseExtraction: Extraction = {
  documentType: 'receipt',
  merchant: "Sainsbury's",
  date: '2026-07-12',
  totalAmount: 22.75,
  currency: 'GBP',
  vatAmount: 0,
  vatRate: null,
  description: 'Groceries for office',
  suggestedCategory: 'Office Costs',
  extractionConfidence: 'high',
  notes: '',
};

const txns: MatchInput[] = [
  { id: 1, date: '2026-07-12', rawDescription: 'SAINSBURYS S/MKT 4321', amountIn: 0, amountOut: 22.75, documentId: null },
  { id: 2, date: '2026-07-13', rawDescription: 'SAINSBURYS S/MKT 9988', amountIn: 0, amountOut: 23.01, documentId: null },
  { id: 3, date: '2026-07-30', rawDescription: 'PREMIER INN LONDON', amountIn: 0, amountOut: 120, documentId: null },
];

describe('matching strategies', () => {
  it('returns exact match candidate', () => {
    const result = rankTransactionCandidates(baseExtraction, txns, 'fuzzy');
    expect(result[0].transactionId).toBe(1);
    expect(result[0].score).toBeGreaterThanOrEqual(85);
  });

  it('ranks amount off by pennies lower than exact amount', () => {
    const result = rankTransactionCandidates(baseExtraction, txns, 'fuzzy');
    expect(result.find((candidate) => candidate.transactionId === 2)?.score).toBeLessThan(
      result.find((candidate) => candidate.transactionId === 1)?.score ?? 0,
    );
  });

  it('excludes dates beyond +2 business days in FreeAgent rule', () => {
    const result = matchWithFreeAgentRule(
      baseExtraction,
      [{ id: 9, date: '2026-07-17', rawDescription: 'SAINSBURYS', amountIn: 0, amountOut: 22.75 }],
    );
    expect(result).toHaveLength(0);
  });

  it('handles mangled bank descriptions', () => {
    const result = rankTransactionCandidates(
      { ...baseExtraction, merchant: "Sainsbury's" },
      [{ id: 22, date: '2026-07-12', rawDescription: 'SAINSBURYS S/MKT 4321', amountIn: 0, amountOut: 22.75 }],
      'fuzzy',
    );
    expect(result[0].score).toBeGreaterThan(70);
  });

  it('provides deterministic ordering for equal candidates', () => {
    const result = rankTransactionCandidates(
      baseExtraction,
      [
        { id: 5, date: '2026-07-12', rawDescription: 'X', amountIn: 0, amountOut: 22.75 },
        { id: 4, date: '2026-07-12', rawDescription: 'X', amountIn: 0, amountOut: 22.75 },
      ],
      'fuzzy',
    );
    expect(result[0].transactionId).toBe(4);
    expect(result[1].transactionId).toBe(5);
  });

  it('returns no candidates when none available', () => {
    const result = rankTransactionCandidates(baseExtraction, [], 'freeagent_rule');
    expect(result).toEqual([]);
  });

  it('matches weeks after transaction because matching anchors to receipt date not upload date', () => {
    const result = matchWithFreeAgentRule(
      { ...baseExtraction, date: '2026-07-01', totalAmount: 48.9, merchant: 'Scotrail' },
      [{ id: 31, date: '2026-07-01', rawDescription: 'SCOTRAIL/EDINBURGH/£48.90', amountIn: 0, amountOut: 48.9 }],
    );
    expect(result[0]?.transactionId).toBe(31);
  });
});
