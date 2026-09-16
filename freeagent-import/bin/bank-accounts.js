import { apiRequest } from '../src/client.js';

const { bank_accounts: bankAccounts } = await apiRequest('/bank_accounts');

for (const account of bankAccounts) {
  console.log(`${account.name ?? '(unnamed)'}\t${account.type ?? ''}\t${account.url}`);
}
