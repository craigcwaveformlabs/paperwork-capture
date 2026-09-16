import { apiRequest } from './client';

export type StatementTransaction = {
  dated_on: string;
  description?: string;
  amount?: number;
  fitid?: string;
  transaction_type?: string;
};

/** Uploads raw bank transactions (a "statement") to a bank account. */
export function uploadStatement(bankAccountUrl: string, transactions: StatementTransaction[]) {
  return apiRequest(`/bank_transactions/statement?bank_account=${encodeURIComponent(bankAccountUrl)}`, {
    method: 'POST',
    body: { statement: transactions },
  });
}

export type BankTransaction = {
  url: string;
  dated_on: string;
  amount: string | number;
  description: string;
  unexplained_amount: string | number;
};

export async function listBankTransactions(bankAccountUrl: string): Promise<BankTransaction[]> {
  const { bank_transactions: created = [] } = await apiRequest<{ bank_transactions?: BankTransaction[] }>(
    `/bank_transactions?bank_account=${encodeURIComponent(bankAccountUrl)}`,
  );
  return created;
}

export type BankAccount = { url: string; name?: string; type?: string };

export async function listBankAccounts(): Promise<BankAccount[]> {
  const { bank_accounts: bankAccounts = [] } = await apiRequest<{ bank_accounts?: BankAccount[] }>('/bank_accounts');
  return bankAccounts;
}
