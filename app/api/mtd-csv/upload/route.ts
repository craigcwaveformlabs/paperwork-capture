import { NextResponse } from 'next/server';
import { parseMtdWorkbook, resolveVatRate, type PurchaseRow, type SalesRow } from '@/lib/freeagent/xlsx';
import { categoryUrlByNominalCode } from '@/lib/freeagent/bridgingCategories';
import { uploadStatement, listBankTransactions, type BankTransaction } from '@/lib/freeagent/statement';
import { explainTransaction, type EvidenceFile } from '@/lib/freeagent/explanations';
import { saveLastUpload } from '@/lib/freeagent/lastUpload';

type Summary = {
  transactionsCreated: number;
  explained: number;
  attached: number;
  warnings: string[];
};

function findMatch(created: BankTransaction[], used: Set<BankTransaction>, row: { date: string; description: string; amount: number }) {
  return created.find(
    (t) =>
      !used.has(t) &&
      t.dated_on === row.date &&
      Math.abs(Number(t.amount) - row.amount) < 0.005 &&
      t.description.startsWith(row.description),
  );
}

function countMatches(created: BankTransaction[], rows: { date: string; description: string; amount: number }[]): number {
  const used = new Set<BankTransaction>();
  let count = 0;
  for (const row of rows) {
    const match = findMatch(created, used, row);
    if (match) {
      used.add(match);
      count += 1;
    }
  }
  return count;
}

/**
 * `uploadStatement` returns before the posted rows are queryable — FreeAgent's sandbox processes
 * statement imports asynchronously (observed ~1.5s for a handful of rows). Poll until every row we
 * just posted can be matched, or give up after `timeoutMs`.
 */
async function listBankTransactionsUntilSettled(
  bankAccountUrl: string,
  expectedRows: { date: string; description: string; amount: number }[],
  timeoutMs = 20000,
  intervalMs = 1000,
): Promise<BankTransaction[]> {
  const deadline = Date.now() + timeoutMs;
  let created = await listBankTransactions(bankAccountUrl);
  while (countMatches(created, expectedRows) < expectedRows.length && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    created = await listBankTransactions(bankAccountUrl);
  }
  return created;
}

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/** Best-effort match: no reference/customer columns in the real template, so we match evidence by name overlap with the row's description. */
function matchEvidence(files: File[], used: Set<File>, searchTexts: (string | undefined)[]): File | undefined {
  const combined = searchTexts.filter(Boolean).join(' ').toLowerCase();
  const combinedNorm = normalise(combined);
  const combinedWords = new Set(combined.split(/[^a-z0-9]+/).filter((w) => w.length >= 4));

  for (const file of files) {
    if (used.has(file)) continue;
    const base = file.name.slice(0, file.name.lastIndexOf('.') === -1 ? undefined : file.name.lastIndexOf('.'));
    const baseNorm = normalise(base);
    if (!baseNorm) continue;

    if (combinedNorm.includes(baseNorm) || baseNorm.includes(combinedNorm)) {
      used.add(file);
      return file;
    }
    const baseWords = base.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
    if (baseWords.some((w) => combinedWords.has(w))) {
      used.add(file);
      return file;
    }
  }
  return undefined;
}

async function toEvidence(file: File): Promise<EvidenceFile> {
  return { fileName: file.name, buffer: Buffer.from(await file.arrayBuffer()) };
}

function resolveCategoryUrl(
  nominalCode: string,
  filingAnalysisLabel: string,
  categoryUrls: Map<string, string>,
  warnings: string[],
  rowLabel: string,
): string | undefined {
  if (!nominalCode) {
    warnings.push(`${rowLabel}: "${filingAnalysisLabel}" has no nominal code (excluded from Income Tax filing) — skipping.`);
    return undefined;
  }
  const categoryUrl = categoryUrls.get(nominalCode);
  if (!categoryUrl) {
    warnings.push(`${rowLabel}: no category with nominal code ${nominalCode} ("${filingAnalysisLabel}") found in FreeAgent — skipping.`);
    return undefined;
  }
  return categoryUrl;
}

type ResolvedRow = {
  kind: 'Sale' | 'Purchase';
  row: SalesRow | PurchaseRow;
  categoryUrl: string | undefined;
  amount: number;
};

export async function POST(request: Request) {
  const formData = await request.formData();

  const bankAccountUrl = String(formData.get('bankAccount') ?? '');
  const workbookFile = formData.get('workbook');
  const evidenceFiles = formData.getAll('evidence').filter((f): f is File => f instanceof File);

  if (!bankAccountUrl || !(workbookFile instanceof File)) {
    return NextResponse.json({ error: 'Bank account and workbook file are required' }, { status: 400 });
  }

  const buffer = Buffer.from(await workbookFile.arrayBuffer());
  const { salesRows, purchaseRows } = await parseMtdWorkbook(buffer);
  saveLastUpload(workbookFile.name, buffer);

  const categoryUrls = await categoryUrlByNominalCode();
  const warnings: string[] = [];
  const usedEvidence = new Set<File>();

  // Every row — sale or purchase — becomes a bank transaction explained against its category.
  // Sales post as credits, purchases as debits.
  const resolved: ResolvedRow[] = [
    ...purchaseRows.map((row: PurchaseRow) => ({
      kind: 'Purchase' as const,
      row,
      categoryUrl: resolveCategoryUrl(row.nominalCode, row.filingAnalysis, categoryUrls, warnings, `Purchase "${row.description}" (${row.date})`),
      amount: -Math.abs(row.amount),
    })),
    ...salesRows.map((row: SalesRow) => ({
      kind: 'Sale' as const,
      row,
      categoryUrl: resolveCategoryUrl(row.nominalCode, row.filingAnalysis, categoryUrls, warnings, `Sale "${row.description}" (${row.date})`),
      amount: Math.abs(row.amount),
    })),
  ];

  // Rows with no resolvable category (e.g. blank spacer/instruction rows in the template) are
  // excluded entirely — posting them to the statement API sends a garbage `dated_on`/description
  // that FreeAgent silently rejects, taking the whole batch down with it.
  const postable = resolved.filter((r): r is ResolvedRow & { categoryUrl: string } => Boolean(r.categoryUrl));

  let created: BankTransaction[] = [];
  if (postable.length > 0) {
    await uploadStatement(
      bankAccountUrl,
      postable.map(({ row, amount }) => ({
        dated_on: row.date,
        description: row.description,
        amount,
        transaction_type: amount < 0 ? 'debit' : 'credit',
      })),
    );
    created = await listBankTransactionsUntilSettled(
      bankAccountUrl,
      postable.map(({ row, amount }) => ({ date: row.date, description: row.description, amount })),
    );
  }

  let explained = 0;
  let attached = 0;
  const usedTransactions = new Set<BankTransaction>();

  for (const { kind, row, categoryUrl, amount } of postable) {
    const description = row.description;
    const match = findMatch(created, usedTransactions, { date: row.date, description, amount });
    if (!match) {
      warnings.push(`${kind} "${description}" (${row.date}): no matching created transaction found — skipping explanation.`);
      continue;
    }
    usedTransactions.add(match);
    if (Number(match.unexplained_amount) === 0) {
      warnings.push(`${kind} "${description}" (${row.date}): transaction already fully explained — skipping.`);
      continue;
    }

    const evidenceFile = matchEvidence(evidenceFiles, usedEvidence, [row.description]);

    try {
      await explainTransaction(
        {
          bank_transaction: match.url,
          dated_on: row.date,
          gross_value: amount,
          category: categoryUrl,
          description,
          sales_tax_rate: resolveVatRate(row.vat),
        },
        evidenceFile ? await toEvidence(evidenceFile) : undefined,
      );
      explained += 1;
      if (evidenceFile) attached += 1;
    } catch (err) {
      warnings.push(`${kind} "${description}" (${row.date}): ${(err as Error).message}`);
    }
  }

  const summary: Summary = { transactionsCreated: created.length, explained, attached, warnings };

  const url = new URL('/mtd-csv', request.url);
  url.searchParams.set('result', JSON.stringify(summary));
  return NextResponse.redirect(url, 303);
}
