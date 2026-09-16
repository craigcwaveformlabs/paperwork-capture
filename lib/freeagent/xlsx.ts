import ExcelJS from 'exceljs';
import { BRIDGING_CATEGORIES } from './bridgingCategories';

export type SalesRow = {
  invoiceDate: string;
  invoiceRef: string;
  customer: string;
  description: string;
  filingAnalysis: string;
  amount: number;
  comments?: string;
  datePaid?: string;
};

export type PurchaseRow = {
  invoiceDate: string;
  reference: string;
  supplier: string;
  description: string;
  filingAnalysis: string;
  amount: number;
  comments?: string;
  datePaid?: string;
};

const SALES_SHEET = 'Sales transactions';
const PURCHASE_SHEET = 'Purchase transactions';
const CODES_SHEET = 'Quarterly filing codes';

const SALES_HEADER = ['Invoice date', 'Invoice No/Ref.', 'Customer', 'Description', 'Quarterly filing analysis', 'Amount (£)', 'Comments', 'Date paid'];
const PURCHASE_HEADER = ['Invoice date', 'Reference (optional)', 'Supplier', 'Description', 'Quarterly filing analysis', 'Amount (£)', 'Comments', 'Date paid (if different)'];

function toDateString(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? trimmed : parsed.toISOString().slice(0, 10);
  }
  return '';
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && 'text' in (value as Record<string, unknown>)) {
    return String((value as { text: unknown }).text ?? '').trim();
  }
  return String(value).trim();
}

function toAmount(value: unknown): number {
  if (typeof value === 'number') return value;
  const cleaned = String(value ?? '').replace(/[£,]/g, '').trim();
  return cleaned ? Number(cleaned) : 0;
}

export async function generateMtdWorkbookTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  const sales = workbook.addWorksheet(SALES_SHEET);
  sales.addRow(['Sales transactions']);
  sales.addRow(['Enter or import all sales transactions']);
  sales.addRow([]);
  sales.addRow(SALES_HEADER).font = { bold: true };
  sales.addRow(['2026-04-06', 'INV0001', 'Customer A', 'Example invoice', 'Sales', 500, '', '']);
  sales.addRow(['2026-04-06', 'INV0002', 'Customer B', 'Example invoice', 'CIS Income', 400, '', '']);
  sales.columns = [{ width: 14 }, { width: 14 }, { width: 20 }, { width: 26 }, { width: 26 }, { width: 12 }, { width: 20 }, { width: 14 }];

  const purchases = workbook.addWorksheet(PURCHASE_SHEET);
  purchases.addRow(['Purchase transactions']);
  purchases.addRow(['Enter or import all purchase transactions']);
  purchases.addRow([]);
  purchases.addRow(PURCHASE_HEADER).font = { bold: true };
  purchases.addRow(['2026-04-06', '', 'Supplier A', 'Example purchase', 'Cost of Sales', 100, '', '']);
  purchases.addRow(['2026-04-06', '', 'Supplier B', 'Example purchase', 'Accountancy Fees', 120, '', '']);
  purchases.columns = [{ width: 14 }, { width: 18 }, { width: 20 }, { width: 26 }, { width: 26 }, { width: 12 }, { width: 20 }, { width: 18 }];

  const codes = workbook.addWorksheet(CODES_SHEET);
  codes.addRow(['MTD Quarterly filing analysis for quarterly income and expenditure updates']);
  codes.addRow(['Reference only — not imported. Each Sales/Purchase row must use one of these labels.']);
  codes.addRow([]);
  codes.addRow(['Income/Expense analysis']).font = { bold: true };
  for (const category of BRIDGING_CATEGORIES) {
    codes.addRow([category.filing_analysis_label]);
  }
  codes.columns = [{ width: 40 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function findHeaderRow(sheet: ExcelJS.Worksheet, expectedFirstCell: string): number {
  let headerRow = -1;
  sheet.eachRow((row, rowNumber) => {
    if (headerRow !== -1) return;
    if (toText(row.getCell(1).value).toLowerCase() === expectedFirstCell.toLowerCase()) {
      headerRow = rowNumber;
    }
  });
  if (headerRow === -1) {
    throw new Error(`Could not find a header row starting with "${expectedFirstCell}" in sheet "${sheet.name}"`);
  }
  return headerRow;
}

function readSalesRows(sheet: ExcelJS.Worksheet): SalesRow[] {
  const headerRow = findHeaderRow(sheet, 'Invoice date');
  const rows: SalesRow[] = [];

  for (let rowNumber = headerRow + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const invoiceDate = row.getCell(1).value;
    if (!invoiceDate) continue; // spacer / blank row

    rows.push({
      invoiceDate: toDateString(invoiceDate),
      invoiceRef: toText(row.getCell(2).value),
      customer: toText(row.getCell(3).value),
      description: toText(row.getCell(4).value),
      filingAnalysis: toText(row.getCell(5).value),
      amount: toAmount(row.getCell(6).value),
      comments: toText(row.getCell(7).value) || undefined,
      datePaid: row.getCell(8).value ? toDateString(row.getCell(8).value) : undefined,
    });
  }
  return rows;
}

function readPurchaseRows(sheet: ExcelJS.Worksheet): PurchaseRow[] {
  const headerRow = findHeaderRow(sheet, 'Invoice date');
  const rows: PurchaseRow[] = [];

  for (let rowNumber = headerRow + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const invoiceDate = row.getCell(1).value;
    if (!invoiceDate) continue;

    rows.push({
      invoiceDate: toDateString(invoiceDate),
      reference: toText(row.getCell(2).value),
      supplier: toText(row.getCell(3).value),
      description: toText(row.getCell(4).value),
      filingAnalysis: toText(row.getCell(5).value),
      amount: toAmount(row.getCell(6).value),
      comments: toText(row.getCell(7).value) || undefined,
      datePaid: row.getCell(8).value ? toDateString(row.getCell(8).value) : undefined,
    });
  }
  return rows;
}

export async function parseMtdWorkbook(buffer: Buffer): Promise<{ salesRows: SalesRow[]; purchaseRows: PurchaseRow[] }> {
  const workbook = new ExcelJS.Workbook();
  // exceljs's bundled types declare an older `Buffer` shape than the @types/node version in this
  // project, so the structurally-newer Buffer needs an explicit cast here.
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

  const salesSheet = workbook.getWorksheet(SALES_SHEET);
  const purchaseSheet = workbook.getWorksheet(PURCHASE_SHEET);
  if (!salesSheet || !purchaseSheet) {
    throw new Error(`Workbook must contain a "${SALES_SHEET}" and a "${PURCHASE_SHEET}" sheet`);
  }

  return {
    salesRows: readSalesRows(salesSheet),
    purchaseRows: readPurchaseRows(purchaseSheet),
  };
}
