import type { Extraction, MatchCandidate, MatchInput, MatchStrategy } from './types';

const STOP_WORDS = new Set(['ltd', 'limited', 'the', 'uk', 'card', 'payment', 'to', 'inc', 'plc', 'co']);

function toMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function transactionAmount(txn: MatchInput) {
  return toMoney(txn.amountOut > 0 ? txn.amountOut : txn.amountIn);
}

function daysBetween(a: string, b: string) {
  const ms = Math.abs(new Date(a).getTime() - new Date(b).getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function isBusinessDay(date: Date) {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

function addBusinessDays(dateString: string, days: number) {
  const date = new Date(dateString);
  let remaining = days;
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    if (isBusinessDay(date)) {
      remaining -= 1;
    }
  }
  return date;
}

function band(score: number): 'high' | 'medium' | 'low' {
  if (score >= 85) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

function cleanTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function merchantScore(extractedMerchant: string, rawDescription: string) {
  const extracted = cleanTokens(extractedMerchant);
  const raw = cleanTokens(rawDescription);
  if (!extracted.length || !raw.length) {
    return 0;
  }

  const rawSet = new Set(raw);
  const overlap = extracted.filter((token) => rawSet.has(token)).length;
  const overlapScore = Math.round((overlap / extracted.length) * 14);

  const extractedPrefix = extractedMerchant.toLowerCase().slice(0, 4);
  const rawPrefix = rawDescription.toLowerCase().slice(0, 4);
  const prefixScore = extractedPrefix && rawPrefix && extractedPrefix === rawPrefix ? 6 : 0;

  return Math.min(20, overlapScore + prefixScore);
}

export function matchWithFreeAgentRule(
  extraction: Extraction,
  transactions: MatchInput[],
): MatchCandidate[] {
  const receiptDate = extraction.date;
  const receiptAmount = toMoney(extraction.totalAmount);
  const maxDate = addBusinessDays(receiptDate, 2);

  const eligible = transactions
    .filter((txn) => {
      const txnDate = new Date(txn.date);
      const min = new Date(receiptDate);
      const amount = transactionAmount(txn);
      return amount === receiptAmount && txnDate >= min && txnDate <= maxDate;
    })
    .sort((a, b) => {
      const dayGap = daysBetween(receiptDate, a.date) - daysBetween(receiptDate, b.date);
      if (dayGap !== 0) return dayGap;
      return a.id - b.id;
    });

  return eligible.map((txn, index) => {
    const penalty = txn.documentId ? 5 : 0;
    const score = Math.max(0, 100 - index * 5 - penalty);
    return {
      transactionId: txn.id,
      score,
      confidence: band(score),
      reason: 'Matches FreeAgent exact amount + receipt date window rule',
    };
  });
}

export function matchWithFuzzyScore(extraction: Extraction, transactions: MatchInput[]): MatchCandidate[] {
  const extractedAmount = toMoney(extraction.totalAmount);

  const ranked = transactions.map((txn) => {
    const amount = transactionAmount(txn);
    const amountDiff = Math.abs(amount - extractedAmount);
    const amountPctDiff = extractedAmount === 0 ? 0 : (amountDiff / extractedAmount) * 100;

    let amountScore = 0;
    if (amountDiff === 0) amountScore = 50;
    else if (amountPctDiff <= 2) amountScore = 36;
    else if (amountDiff <= 1) amountScore = 22;
    else if (amountDiff <= 5) amountScore = 8;

    const dayDiff = daysBetween(extraction.date, txn.date);
    let dateScore = 0;
    if (dayDiff === 0) dateScore = 30;
    else if (dayDiff <= 3) dateScore = 22;
    else if (dayDiff <= 7) dateScore = 12;
    else if (dayDiff <= 14) dateScore = 4;

    const merchant = merchantScore(extraction.merchant, txn.rawDescription);
    const duplicatePenalty = txn.documentId ? 8 : 0;
    const score = Math.max(0, amountScore + dateScore + merchant - duplicatePenalty);

    return {
      transactionId: txn.id,
      score,
      confidence: band(score),
      reason: `amount:${amountScore} date:${dateScore} merchant:${merchant}${duplicatePenalty ? ' duplicate:-8' : ''}`,
    } satisfies MatchCandidate;
  });

  return ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.transactionId - b.transactionId;
  });
}

export function rankTransactionCandidates(
  extraction: Extraction,
  transactions: MatchInput[],
  strategy: MatchStrategy,
): MatchCandidate[] {
  if (strategy === 'freeagent_rule') {
    return matchWithFreeAgentRule(extraction, transactions);
  }
  return matchWithFuzzyScore(extraction, transactions);
}
