import ExcelJS from 'exceljs';
import { MTD_FILING_CODES, normaliseNominalCode } from './mtdFilingCodes';

export type SalesRow = {
  date: string;
  description: string;
  filingAnalysis: string;
  amount: number;
  vat: string;
  nominalCode: string;
};

export type PurchaseRow = {
  date: string;
  description: string;
  filingAnalysis: string;
  amount: number;
  vat: string;
  nominalCode: string;
};

const SALES_SHEET = 'Sales transactions';
const PURCHASE_SHEET = 'Purchase transactions';
const CODES_SHEET = 'Quarterly filing codes';

const SALES_HEADER = ['Date', 'Description', 'Quarterly filing analysis', 'Amount (£)', 'VAT', 'Nominal Code'];
const PURCHASE_HEADER = ['Date', 'Description', 'Accounting Categories', 'Amount (£)', 'VAT', 'Nominal Code'];

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

/** Rounded to the penny — FreeAgent stores amounts to 2dp, and source cells can carry long repeating decimals (e.g. a formula-driven split of 3000/7). */
function toAmount(value: unknown): number {
  const raw = typeof value === 'number' ? value : Number(String(value ?? '').replace(/[£,]/g, '').trim() || 0);
  return Math.round(raw * 100) / 100;
}

/** Formula cells (e.g. the XLOOKUP-driven Nominal Code column) load with a cached `.result`. */
function toNominalCode(value: unknown): string {
  if (value !== null && typeof value === 'object' && 'result' in (value as Record<string, unknown>)) {
    return normaliseNominalCode(String((value as { result: unknown }).result ?? ''));
  }
  return normaliseNominalCode(toText(value));
}

/** Returns undefined for blank/"auto"-like VAT cells (let FreeAgent apply its own default), else a numeric rate string. */
export function resolveVatRate(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.toLowerCase() === 'auto') return undefined;
  const cleaned = trimmed.replace(/[%]/g, '');
  const numeric = Number(cleaned);
  return Number.isNaN(numeric) ? undefined : numeric.toFixed(1);
}

/** Realistic sample rows for the downloadable template — an electrician sole trader's Q1 2026-27 quarter. */
const SAMPLE_SALES: { date: string; description: string; label: string; amount: number }[] = [
  { date: '2026-04-08', description: 'Invoice 1042 - J Whitfield, rewire (Elm Grove)', label: 'Sales', amount: 1850 },
  { date: '2026-04-15', description: 'Invoice 1043 - Kestrel Property Services, consumer unit upgrade', label: 'Sales', amount: 620 },
  { date: '2026-04-22', description: 'Invoice 1044 - M Patel, EICR test', label: 'Sales', amount: 180 },
  { date: '2026-04-29', description: 'Invoice 1045 - Oakfield Joinery, workshop lighting', label: 'Sales', amount: 940 },
  { date: '2026-05-06', description: 'Invoice 1046 - R Doyle, socket & switch upgrade', label: 'Sales', amount: 265 },
  { date: '2026-05-13', description: 'Invoice 1047 - Marsden Farms, barn power supply', label: 'Sales', amount: 1420 },
  { date: '2026-05-20', description: 'Invoice 1048 - S Ahmed, fault finding call-out', label: 'Sales', amount: 95 },
  { date: '2026-05-27', description: 'Invoice 1049 - Copper & Reed Design, studio rewire', label: 'Sales', amount: 780 },
  { date: '2026-06-03', description: 'Invoice 1050 - T Nguyen, EV charger install', label: 'Sales', amount: 650 },
  { date: '2026-06-10', description: 'Invoice 1051 - Kestrel Fitness, gym electrics', label: 'Sales', amount: 1120 },
  { date: '2026-06-17', description: 'Bank interest received', label: 'Interest Received', amount: 4.5 },
  { date: '2026-06-24', description: 'Invoice 1052 - L Marshall, landlord safety certificate', label: 'Sales', amount: 150 },
];

const SAMPLE_PURCHASES: { date: string; description: string; label: string; amount: number }[] = [
  { date: '2026-04-05', description: 'City Electrical Factors - cable & consumer units', label: 'Materials', amount: 412.3 },
  { date: '2026-04-10', description: 'Fuel - Shell garage (van)', label: 'Motor Expenses', amount: 68.4 },
  { date: '2026-04-14', description: 'Screwfix - fixings & tools', label: 'Materials', amount: 54.12 },
  { date: '2026-04-18', description: 'Public liability insurance - annual premium', label: 'Insurance', amount: 340 },
  { date: '2026-04-25', description: 'Mobile phone bill - EE', label: 'Mobile Phone', amount: 42 },
  { date: '2026-05-02', description: 'Van lease payment', label: 'Leasing Payments', amount: 285 },
  { date: '2026-05-06', description: 'Fuel - BP garage (van)', label: 'Motor Expenses', amount: 71.2 },
  { date: '2026-05-09', description: 'Facebook ads - local promotion', label: 'Advertising and Promotion', amount: 60 },
  { date: '2026-05-14', description: 'City Electrical Factors - cable & switchgear', label: 'Materials', amount: 380.75 },
  { date: '2026-05-20', description: 'Accountancy fees - Q1 bookkeeping', label: 'Accountancy Fees', amount: 150 },
  { date: '2026-05-23', description: 'Use of home as office (flat rate)', label: 'Use of Home', amount: 26 },
  { date: '2026-05-29', description: 'Fuel - Shell garage (van)', label: 'Motor Expenses', amount: 65.9 },
  { date: '2026-06-03', description: 'Toolstation - PPE & consumables', label: 'Materials', amount: 47.6 },
  { date: '2026-06-08', description: 'Broadband & phone - BT Business', label: 'Internet & Telephone', amount: 55 },
  { date: '2026-06-12', description: 'Bank charges - business account', label: 'Bank/Finance Charges', amount: 12.5 },
  { date: '2026-06-16', description: 'Van insurance renewal', label: 'Insurance', amount: 410 },
  { date: '2026-06-20', description: 'Fuel - BP garage (van)', label: 'Motor Expenses', amount: 73.15 },
  { date: '2026-06-27', description: 'Skip hire - rewire job clearance', label: 'Sundries', amount: 95 },
];

function codeFor(label: string) {
  const code = MTD_FILING_CODES.find((c) => c.label === label);
  if (!code) throw new Error(`Unknown filing code label: ${label}`);
  return code;
}

export async function generateMtdWorkbookTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  const sales = workbook.addWorksheet(SALES_SHEET);
  sales.addRow(['Sales transactions']);
  sales.addRow(['Enter or import all sales transactions']);
  sales.addRow(['Please enter a quarterly filing analysis for all transactions (unless you wish to exclude item from quarterly Income Tax filing)']);
  sales.addRow(SALES_HEADER).font = { bold: true };
  for (const row of SAMPLE_SALES) {
    sales.addRow([row.date, row.description, codeFor(row.label).label, row.amount, 'auto', codeFor(row.label).nominalCode]);
  }
  sales.columns = [{ width: 14 }, { width: 40 }, { width: 26 }, { width: 12 }, { width: 10 }, { width: 14 }];

  const purchases = workbook.addWorksheet(PURCHASE_SHEET);
  purchases.addRow(['Purchase transactions']);
  purchases.addRow(['Enter or import all purchases transactions']);
  purchases.addRow(['Please enter a quarterly filing analysis for all transactions (unless you wish to exclude item from quarterly Income Tax reporting)']);
  purchases.addRow(PURCHASE_HEADER).font = { bold: true };
  for (const row of SAMPLE_PURCHASES) {
    purchases.addRow([row.date, row.description, codeFor(row.label).label, row.amount, 'auto', codeFor(row.label).nominalCode]);
  }
  purchases.columns = [{ width: 14 }, { width: 40 }, { width: 26 }, { width: 12 }, { width: 10 }, { width: 14 }];

  const codes = workbook.addWorksheet(CODES_SHEET);
  codes.addRow(['MTD Quarterly filing analysis for quarterly income and expenditure updates']);
  codes.addRow(['Reference only — not imported. Each Sales/Purchase row must use one of these labels.']);
  codes.addRow([]);
  codes.addRow(['Income/Expense analysis', 'FreeAgent Nominal']).font = { bold: true };
  for (const code of MTD_FILING_CODES) {
    codes.addRow([code.label, code.nominalCode ?? '']);
  }
  codes.columns = [{ width: 40 }, { width: 16 }];

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

function readRows(sheet: ExcelJS.Worksheet): SalesRow[] {
  const headerRow = findHeaderRow(sheet, 'Date');
  const rows: SalesRow[] = [];

  for (let rowNumber = headerRow + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const date = row.getCell(1).value;
    if (!date) continue; // spacer / blank row

    rows.push({
      date: toDateString(date),
      description: toText(row.getCell(2).value),
      filingAnalysis: toText(row.getCell(3).value),
      amount: toAmount(row.getCell(4).value),
      vat: toText(row.getCell(5).value),
      nominalCode: toNominalCode(row.getCell(6).value),
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
    salesRows: readRows(salesSheet),
    purchaseRows: readRows(purchaseSheet),
  };
}
