import { apiRequest } from './client.js';

/**
 * Uploads raw bank transactions (a "statement") to a bank account.
 * @param {string} bankAccountUrl - the bank account's FreeAgent URL
 * @param {Array<{dated_on: string, description?: string, amount?: number, fitid?: string, transaction_type?: string}>} transactions
 */
export function uploadStatement(bankAccountUrl, transactions) {
  return apiRequest(`/bank_transactions/statement?bank_account=${encodeURIComponent(bankAccountUrl)}`, {
    method: 'POST',
    body: { statement: transactions },
  });
}
