import Link from 'next/link';
import { generateMtdWorkbookTemplate, parseMtdWorkbook, type PurchaseRow, type SalesRow } from '@/lib/freeagent/xlsx';
import { MTD_FILING_CODES } from '@/lib/freeagent/mtdFilingCodes';
import { loadLastUpload } from '@/lib/freeagent/lastUpload';

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-GB');
}

function WorkbookRowsTable({ rows, categoryHeader }: { rows: (SalesRow | PurchaseRow)[]; categoryHeader: string }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-line bg-pageBg text-left">
          <th className="p-2.5">Date</th>
          <th className="p-2.5">Description</th>
          <th className="p-2.5">{categoryHeader}</th>
          <th className="p-2.5 text-right">Amount (£)</th>
          <th className="p-2.5">VAT</th>
          <th className="p-2.5">Nominal Code</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-line/60 last:border-b-0">
            <td className="p-2.5">{row.date}</td>
            <td className="p-2.5">{row.description}</td>
            <td className="p-2.5">{row.filingAnalysis}</td>
            <td className="p-2.5 text-right font-mono">{row.amount.toFixed(2)}</td>
            <td className="p-2.5 text-slate-500">{row.vat || '—'}</td>
            <td className="p-2.5 text-slate-500">{row.nominalCode || '—'}</td>
          </tr>
        ))}
        {rows.length === 0 ? (
          <tr>
            <td className="p-3 text-slate-400" colSpan={6}>
              No rows to show.
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}

function CodesTable() {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-line bg-pageBg text-left">
          <th className="p-2.5">Income/Expense analysis</th>
          <th className="p-2.5">FreeAgent Nominal</th>
        </tr>
      </thead>
      <tbody>
        {MTD_FILING_CODES.map((code) => (
          <tr key={code.label} className="border-b border-line/60 last:border-b-0">
            <td className="p-2.5">{code.label}</td>
            <td className="p-2.5">{code.nominalCode ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function MtdWorkbookViewPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; sheet?: string }>;
}) {
  const { source, sheet } = await searchParams;
  const activeSource = source === 'uploaded' ? 'uploaded' : 'template';
  const activeSheet = sheet === 'purchases' ? 'purchases' : sheet === 'codes' ? 'codes' : 'sales';

  let fileName: string;
  let meta: string;
  let salesRows: SalesRow[] = [];
  let purchaseRows: PurchaseRow[] = [];

  if (activeSource === 'template') {
    const buffer = await generateMtdWorkbookTemplate();
    fileName = 'mtd-bridging-template.xlsx';
    meta = 'Generated fresh each time — this is exactly what "Download" gives you.';
    ({ salesRows, purchaseRows } = await parseMtdWorkbook(buffer));
  } else {
    const lastUpload = loadLastUpload();
    fileName = lastUpload?.fileName ?? 'No file uploaded yet';
    meta = lastUpload ? `Uploaded ${formatTimestamp(lastUpload.uploadedAt)}` : 'Upload a workbook to see it here.';
    if (lastUpload) {
      ({ salesRows, purchaseRows } = await parseMtdWorkbook(Buffer.from(lastUpload.fileBase64, 'base64')));
    }
  }

  function sourceHref(nextSource: string) {
    return `/mtd-csv/view?source=${nextSource}&sheet=${activeSheet}`;
  }
  function sheetHref(nextSheet: string) {
    return `/mtd-csv/view?source=${activeSource}&sheet=${nextSheet}`;
  }

  return (
    <section className="max-w-4xl mx-auto bg-white border border-line rounded-lg overflow-hidden">
      <div className="px-6 pt-5 pb-0">
        <Link href="/mtd-csv" className="text-xs text-link underline">
          ‹ Back to MTD workbook
        </Link>
        <h1 className="text-lg font-bold mt-2">Workbook viewer</h1>

        <div className="flex gap-5 border-b border-line mt-4">
          <Link
            href={sourceHref('template')}
            className={`pb-2.5 text-sm font-medium border-b-2 -mb-px ${
              activeSource === 'template' ? 'border-link text-link' : 'border-transparent text-slate-500'
            }`}
          >
            Template
          </Link>
          <Link
            href={sourceHref('uploaded')}
            className={`pb-2.5 text-sm font-medium border-b-2 -mb-px ${
              activeSource === 'uploaded' ? 'border-link text-link' : 'border-transparent text-slate-500'
            }`}
          >
            Uploaded file
          </Link>
        </div>

        <div className="flex gap-2 mt-4">
          {(['sales', 'purchases', 'codes'] as const).map((s) => (
            <Link
              key={s}
              href={sheetHref(s)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                activeSheet === s ? 'bg-link text-white' : 'bg-pageBg text-slate-500'
              }`}
            >
              {s === 'sales' ? 'Sales transactions' : s === 'purchases' ? 'Purchase transactions' : 'Quarterly filing codes'}
            </Link>
          ))}
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-baseline justify-between mb-3">
          <span className="font-mono text-sm font-semibold">{fileName}</span>
          <span className="text-xs text-slate-500">{meta}</span>
        </div>

        <div className="border border-line rounded-md overflow-hidden">
          {activeSheet === 'sales' ? <WorkbookRowsTable rows={salesRows} categoryHeader="Quarterly filing analysis" /> : null}
          {activeSheet === 'purchases' ? <WorkbookRowsTable rows={purchaseRows} categoryHeader="Accounting Categories" /> : null}
          {activeSheet === 'codes' ? <CodesTable /> : null}
        </div>
      </div>
    </section>
  );
}
