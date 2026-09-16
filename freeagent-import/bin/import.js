import fs from 'fs';
import { uploadStatement } from '../src/statement.js';
import { explainTransaction } from '../src/explanations.js';
import { apiRequest } from '../src/client.js';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: npm run import -- <path-to-transactions.json>');
  process.exit(1);
}

const input = JSON.parse(fs.readFileSync(filePath, 'utf8'));
if (!input.bankAccount || !Array.isArray(input.transactions) || input.transactions.length === 0) {
  console.error('Input file must have a "bankAccount" URL and a non-empty "transactions" array.');
  process.exit(1);
}

// The statement endpoint only wants the raw transaction fields — category/receipt
// are our own bookkeeping, stripped before upload and used again below.
const statementTransactions = input.transactions.map(
  ({ category, receipt, ...rest }) => rest
);

console.log(`Uploading statement (${statementTransactions.length} transactions)...`);
// The statement endpoint responds 200 with an empty body on success, so the
// created transactions have to be looked up separately to match against.
await uploadStatement(input.bankAccount, statementTransactions);

const { bank_transactions: created = [] } = await apiRequest(
  `/bank_transactions?bank_account=${encodeURIComponent(input.bankAccount)}`
);

function findMatch(source) {
  return created.find(
    (t) =>
      t.dated_on === source.dated_on &&
      Number(t.amount) === Number(source.amount) &&
      // FreeAgent appends "//DEBIT/" or "//CREDIT/" to the description we sent.
      t.description.startsWith(source.description)
  );
}

for (const source of input.transactions) {
  if (!source.category) continue;

  const match = findMatch(source);
  if (!match) {
    console.warn(`No matching created transaction for "${source.description}" on ${source.dated_on} — skipping explanation.`);
    continue;
  }

  if (Number(match.unexplained_amount) === 0) {
    console.log(`"${source.description}" is already fully explained — skipping.`);
    continue;
  }

  console.log(`Explaining "${source.description}"...`);
  await explainTransaction(
    {
      bank_transaction: match.url,
      dated_on: source.dated_on,
      gross_value: source.amount,
      category: source.category,
      description: source.description,
    },
    source.receipt
  );
}

console.log('Done.');
