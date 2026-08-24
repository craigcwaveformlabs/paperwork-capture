import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'paperwork-capture.sqlite');

let dbInstance: Database.Database | null = null;

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  fs.mkdirSync(dataDir, { recursive: true });
  dbInstance = new Database(dbPath);
  dbInstance.pragma('journal_mode = WAL');
  runMigrations(dbInstance);
  return dbInstance;
}

function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      businessType TEXT NOT NULL,
      email TEXT NOT NULL,
      contactName TEXT NOT NULL,
      smartCaptureAllowance INTEGER NOT NULL,
      smartCaptureUsed INTEGER NOT NULL,
      allowanceResetsOn TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bank_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientId INTEGER NOT NULL,
      name TEXT NOT NULL,
      balance REAL NOT NULL,
      FOREIGN KEY(clientId) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accountId INTEGER NOT NULL,
      date TEXT NOT NULL,
      merchant TEXT NOT NULL,
      rawDescription TEXT NOT NULL,
      amountIn REAL NOT NULL DEFAULT 0,
      amountOut REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      category TEXT,
      vatRate TEXT,
      description TEXT,
      documentId INTEGER,
      attachmentNote TEXT,
      approvedAt TEXT,
      FOREIGN KEY(accountId) REFERENCES bank_accounts(id),
      FOREIGN KEY(documentId) REFERENCES documents(id)
    );

    CREATE TABLE IF NOT EXISTS paperwork_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientId INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      message TEXT NOT NULL,
      channels TEXT NOT NULL,
      privacy TEXT NOT NULL,
      status TEXT NOT NULL,
      viewedAt TEXT,
      FOREIGN KEY(clientId) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS request_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requestId INTEGER NOT NULL,
      transactionId INTEGER NOT NULL,
      status TEXT NOT NULL,
      documentId INTEGER,
      FOREIGN KEY(requestId) REFERENCES paperwork_requests(id),
      FOREIGN KEY(transactionId) REFERENCES transactions(id),
      FOREIGN KEY(documentId) REFERENCES documents(id)
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      mimeType TEXT NOT NULL,
      path TEXT NOT NULL,
      sizeBytes INTEGER NOT NULL,
      requestId INTEGER,
      uploadedBy TEXT NOT NULL,
      uploadedAt TEXT NOT NULL,
      privacy TEXT NOT NULL,
      quotaConsumed INTEGER NOT NULL,
      extractionJson TEXT,
      matchedTransactionId INTEGER,
      matchScore REAL,
      matchConfidence TEXT,
      rankedCandidatesJson TEXT,
      FOREIGN KEY(requestId) REFERENCES paperwork_requests(id),
      FOREIGN KEY(matchedTransactionId) REFERENCES transactions(id)
    );

    CREATE TABLE IF NOT EXISTS accuracy_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      documentId INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      correctedAmount INTEGER NOT NULL,
      correctedDate INTEGER NOT NULL,
      correctedTransaction INTEGER NOT NULL,
      correctedCategory INTEGER NOT NULL,
      cleanAccept INTEGER NOT NULL,
      FOREIGN KEY(documentId) REFERENCES documents(id)
    );

    CREATE TABLE IF NOT EXISTS outbox_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requestId INTEGER,
      recipientEmail TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      uploadLink TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(requestId) REFERENCES paperwork_requests(id)
    );

    CREATE TABLE IF NOT EXISTS client_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientId INTEGER NOT NULL UNIQUE,
      passcodeHash TEXT,
      passcodeExpiresAt TEXT,
      createdAt TEXT NOT NULL,
      lastLoginAt TEXT,
      FOREIGN KEY(clientId) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS client_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientAccountId INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      FOREIGN KEY(clientAccountId) REFERENCES client_accounts(id)
    );

    CREATE TABLE IF NOT EXISTS mtd_figures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requestId INTEGER NOT NULL,
      categoryKey TEXT NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY(requestId) REFERENCES paperwork_requests(id)
    );
  `);

  ensureColumn(db, 'paperwork_requests', 'kind', "TEXT NOT NULL DEFAULT 'transaction'");
  ensureColumn(db, 'paperwork_requests', 'periodStart', 'TEXT');
  ensureColumn(db, 'paperwork_requests', 'periodEnd', 'TEXT');
  ensureColumn(db, 'paperwork_requests', 'quarterLabel', 'TEXT');
  ensureColumn(db, 'paperwork_requests', 'dataReceivedAt', 'TEXT');
  ensureColumn(db, 'paperwork_requests', 'loadedAt', 'TEXT');

  ensureColumn(db, 'clients', 'portalToken', 'TEXT');

  ensureColumn(db, 'bank_accounts', 'kind', "TEXT NOT NULL DEFAULT 'client'");

  ensureColumn(db, 'transactions', 'mtdRequestId', 'INTEGER');

  ensureColumn(db, 'documents', 'mtdSourceKind', 'TEXT');
}

function ensureColumn(db: Database.Database, table: string, column: string, definition?: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (columns.some((entry) => entry.name === column)) {
    return;
  }
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition ?? 'TEXT'}`);
}

export function resetDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
}

export function getDbPath() {
  return dbPath;
}
