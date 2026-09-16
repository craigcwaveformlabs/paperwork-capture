import { NextResponse } from 'next/server';
import { parseMtdWorkbook, type PurchaseRow, type SalesRow } from '@/lib/freeagent/xlsx';
import { categoryForFilingLabel, categoryUrlByDescription } from '@/lib/freeagent/bridgingCategories';
import { uploadStatement, listBankTransactions, type BankTransaction } from '@/lib/freeagent/statement';
import { explainTransaction, type EvidenceFile } from '@/lib/freeagent/explanations';
import { findOrCreateContact } from '@/lib/freeagent/contacts';
import { createInvoice } from '@/lib/freeagent/invoices';
import { saveLastUpload } from '@/lib/freeagent/lastUpload';

type Summary = {
  invoicesCreated: number;
  transactionsCreated: number;
  explained: number;
  attached: number;
  warnings: string[];
};

function findMatch(created: BankTransaction[], row: { date: string; description: string; amount: number }) {
  return created.find(
    (t) => t.dated_on === row.date && Number(t.amount) === Number(row.amount) && t.description.startsWith(row.description),
  );
}

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/** Best-effort match: no receipt_filename column in the real template, so we match evidence by name overlap with the row's own text. */
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

function resolveCategoryUrl(label: string, categoryUrls: Map<string, string>, warnings: string[], rowLabel: string): string | undefined {
  const preset = categoryForFilingLabel(label);
  if (!preset) {
    warnings.push(`${rowLabel}: unknown quarterly filing analysis label "${label}" — skipping.`);
    return undefined;
  }
  const categoryUrl = categoryUrls.get(preset.description);
  if (!categoryUrl) {
    warnings.push(`${rowLabel}: category for "${label}" hasn't been created in FreeAgent yet — skipping.`);
    return undefined;
  }
  return categoryUrl;
}

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

  const categoryUrls = await categoryUrlByDescription();
  const warnings: string[] = [];
  const usedEvidence = new Set<File>();

  // --- Purchases -> bank transactions ---
  const resolvedPurchases = purchaseRows.map((row: PurchaseRow) => ({
    row,
    categoryUrl: resolveCategoryUrl(row.filingAnalysis, categoryUrls, warnings, `Purchase "${row.description}" (${row.invoiceDate})`),
    amount: -Math.abs(row.amount),
  }));

  let created: BankTransaction[] = [];
  if (resolvedPurchases.length > 0) {
    await uploadStatement(
      bankAccountUrl,
      resolvedPurchases.map(({ row, amount }) => ({
        dated_on: row.invoiceDate,
        description: row.description || row.supplier,
        amount,
        transaction_type: 'debit',
      })),
    );
    created = await listBankTransactions(bankAccountUrl);
  }

  let explained = 0;
  let attached = 0;

  for (const { row, categoryUrl, amount } of resolvedPurchases) {
    if (!categoryUrl) continue;

    const description = row.description || row.supplier;
    const match = findMatch(created, { date: row.invoiceDate, description, amount });
    if (!match) {
      warnings.push(`Purchase "${description}" (${row.invoiceDate}): no matching created transaction found — skipping explanation.`);
      continue;
    }
    if (Number(match.unexplained_amount) === 0) {
      warnings.push(`Purchase "${description}" (${row.invoiceDate}): transaction already fully explained — skipping.`);
      continue;
    }

    const evidenceFile = matchEvidence(evidenceFiles, usedEvidence, [row.reference, row.supplier, row.description, row.comments]);

    try {
      await explainTransaction(
        {
          bank_transaction: match.url,
          dated_on: row.invoiceDate,
          gross_value: amount,
          category: categoryUrl,
          description,
        },
        evidenceFile ? await toEvidence(evidenceFile) : undefined,
      );
      explained += 1;
      if (evidenceFile) attached += 1;
    } catch (err) {
      warnings.push(`Purchase "${description}" (${row.invoiceDate}): ${(err as Error).message}`);
    }
  }

  // --- Sales -> invoices ---
  const contactCache = new Map<string, string>();
  let invoicesCreated = 0;

  for (const row of salesRows as SalesRow[]) {
    const categoryUrl = resolveCategoryUrl(row.filingAnalysis, categoryUrls, warnings, `Sale "${row.description}" (${row.invoiceDate})`);
    if (!categoryUrl) continue;

    const evidenceFile = matchEvidence(evidenceFiles, usedEvidence, [row.invoiceRef, row.customer, row.description, row.comments]);

    try {
      const contactUrl = await findOrCreateContact(row.customer, contactCache);
      await createInvoice(
        {
          contactUrl,
          // Cash-basis dating: if the row's been paid, date the invoice by when the cash
          // actually moved rather than the original invoice date.
          datedOn: row.datePaid || row.invoiceDate,
          reference: row.invoiceRef || row.description,
          items: [{ description: row.description || row.customer, amount: row.amount, categoryUrl }],
        },
        evidenceFile ? await toEvidence(evidenceFile) : undefined,
      );
      invoicesCreated += 1;
      if (evidenceFile) attached += 1;
    } catch (err) {
      warnings.push(`Sale "${row.description}" (${row.invoiceDate}): ${(err as Error).message}`);
    }
  }

  const summary: Summary = { invoicesCreated, transactionsCreated: created.length, explained, attached, warnings };

  const url = new URL('/mtd-csv', request.url);
  url.searchParams.set('result', JSON.stringify(summary));
  return NextResponse.redirect(url, 303);
}
