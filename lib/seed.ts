import { getDb, resetDatabase } from './db';

type SeedTxn = {
  date: string;
  merchant: string;
  rawDescription: string;
  amountIn?: number;
  amountOut?: number;
  status: 'unexplained' | 'for_approval' | 'explained' | 'manually_added';
  category?: string;
  description?: string;
};

const transactions: SeedTxn[] = [
  { date: '2026-07-01', merchant: 'Scotrail', rawDescription: 'SCOTRAIL/EDINBURGH/£48.90', amountOut: 48.9, status: 'unexplained' },
  { date: '2026-07-02', merchant: "Sainsbury's", rawDescription: 'SAINSBURYS S/MKT 4321', amountOut: 22.75, status: 'unexplained' },
  { date: '2026-07-03', merchant: 'B&Q Newcastle', rawDescription: 'B&Q NEWCASTLE 1204', amountOut: 86.12, status: 'for_approval', category: 'Repairs and Maintenance' },
  { date: '2026-07-04', merchant: 'Local Council', rawDescription: 'LOCAL COUNCIL BUSINESS RATES', amountOut: 145, status: 'explained', category: 'Rates' },
  { date: '2026-07-05', merchant: 'Virgin Mobile', rawDescription: 'VIRGIN MOBILE DIRECT DEBIT', amountOut: 29, status: 'unexplained' },
  { date: '2026-07-06', merchant: 'Community Fibre', rawDescription: 'COMMUNITY FIBRE LTD', amountOut: 39.99, status: 'unexplained' },
  { date: '2026-07-07', merchant: 'Notting Hill Trust', rawDescription: 'NOTTING HILL TRUST//OTHER/£564.69', amountOut: 564.69, status: 'unexplained' },
  { date: '2026-07-08', merchant: 'Shell', rawDescription: 'SHELL KINGS CROSS', amountOut: 71.23, status: 'for_approval', category: 'Motor Expenses' },
  { date: '2026-07-09', merchant: 'Premier Inn', rawDescription: 'PREMIER INN LONDON KENS', amountOut: 129, status: 'unexplained' },
  { date: '2026-07-10', merchant: 'Amazon', rawDescription: 'AMAZON EU SARL', amountOut: 17.49, status: 'unexplained' },
  { date: '2026-07-11', merchant: 'Scotrail', rawDescription: 'SCOTRAIL GLASGOW', amountOut: 56.1, status: 'explained', category: 'Travel' },
  { date: '2026-07-12', merchant: "Sainsbury's", rawDescription: 'SAINSBURYS S/MKT 9988', amountOut: 19.22, status: 'unexplained' },
  { date: '2026-07-13', merchant: 'B&Q Newcastle', rawDescription: 'B&Q NEWCASTLE 1204', amountOut: 34.54, status: 'manually_added' },
  { date: '2026-07-14', merchant: 'Local Council', rawDescription: 'LOCAL COUNCIL PERMIT', amountOut: 65, status: 'unexplained' },
  { date: '2026-07-15', merchant: 'Virgin Mobile', rawDescription: 'VIRGIN MOBILE DIRECT DEBIT', amountOut: 29, status: 'for_approval', category: 'Mobile Phone' },
  { date: '2026-07-16', merchant: 'Community Fibre', rawDescription: 'COMMUNITY FIBRE LTD', amountOut: 39.99, status: 'explained', category: 'Internet & Telephone' },
  { date: '2026-07-17', merchant: 'Notting Hill Trust', rawDescription: 'NOTTING HILL TRUST RNT', amountOut: 564.69, status: 'unexplained' },
  { date: '2026-07-18', merchant: 'Shell', rawDescription: 'SHELL KINGS CROSS', amountOut: 66.51, status: 'unexplained' },
  { date: '2026-07-19', merchant: 'Premier Inn', rawDescription: 'PREMIER INN BRISTOL', amountOut: 141.22, status: 'unexplained' },
  { date: '2026-07-20', merchant: 'Amazon', rawDescription: 'AMAZON MKTPLACE PMTS', amountOut: 11.99, status: 'unexplained' },
];

export function seedDatabase({ reset = false }: { reset?: boolean } = {}) {
  if (reset) {
    resetDatabase();
  }

  const db = getDb();
  const existing = db.prepare('SELECT COUNT(*) as count FROM clients').get() as { count: number };
  if (existing.count > 0) {
    return;
  }

  const now = new Date().toISOString();
  const insertClient = db.prepare(`
    INSERT INTO clients (name, businessType, email, contactName, smartCaptureAllowance, smartCaptureUsed, allowanceResetsOn)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const client = insertClient.run(
    'Sam Smith',
    'sole trader',
    'sam@example.com',
    'Sam Smith',
    15,
    6,
    '2026-08-01',
  );

  const account = db
    .prepare('INSERT INTO bank_accounts (clientId, name, balance) VALUES (?, ?, ?)')
    .run(client.lastInsertRowid, 'Mettle', 4862.75);

  const insertTxn = db.prepare(`
    INSERT INTO transactions (
      accountId, date, merchant, rawDescription, amountIn, amountOut, status, category, description, approvedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const txn of transactions) {
    insertTxn.run(
      account.lastInsertRowid,
      txn.date,
      txn.merchant,
      txn.rawDescription,
      txn.amountIn ?? 0,
      txn.amountOut ?? 0,
      txn.status,
      txn.category ?? null,
      txn.description ?? null,
      txn.status === 'explained' ? now : null,
    );
  }
}

if (require.main === module) {
  const reset = process.argv.includes('--reset');
  seedDatabase({ reset });
  console.log(reset ? 'Database reset + seeded' : 'Database seeded');
}
