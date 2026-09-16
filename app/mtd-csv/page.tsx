import Link from 'next/link';
import { isConnected } from '@/lib/freeagent/client';
import { listBankAccounts } from '@/lib/freeagent/statement';

type Summary = {
  invoicesCreated: number;
  transactionsCreated: number;
  explained: number;
  attached: number;
  warnings: string[];
};

function RequiredBadge() {
  return (
    <span className="inline-flex items-center px-2 h-5 rounded-full text-xs font-bold bg-orangeBg text-orange">
      Required
    </span>
  );
}

function OptionalBadge() {
  return (
    <span className="inline-flex items-center px-2 h-5 rounded-full text-xs font-bold bg-pageBg text-slate-500">
      Optional
    </span>
  );
}

function Dropzone({
  id,
  name,
  icon,
  title,
  sub,
  accept,
  required,
  multiple,
}: {
  id: string;
  name: string;
  icon: string;
  title: string;
  sub: string;
  accept?: string;
  required?: boolean;
  multiple?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className="mt-3 flex flex-col items-center justify-center text-center gap-1.5 border-2 border-dashed border-line rounded-md py-7 px-4 cursor-pointer hover:border-link hover:bg-pageBg transition-colors"
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-semibold text-sm">{title}</span>
      <span className="text-xs text-slate-500">{sub}</span>
      <input
        id={id}
        name={name}
        type="file"
        accept={accept}
        required={required}
        multiple={multiple}
        className="mt-2 text-xs"
      />
    </label>
  );
}

export default async function FreeAgentMtdCsvPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  const { result } = await searchParams;

  if (!isConnected()) {
    return (
      <section className="max-w-2xl mx-auto bg-white border border-line rounded-lg p-4">
        <p className="text-sm">
          Not connected yet — go to <a href="/" className="text-link underline">Live FreeAgent</a> and connect first.
        </p>
      </section>
    );
  }

  const bankAccounts = await listBankAccounts();
  let summary: Summary | null = null;
  if (result) {
    try {
      summary = JSON.parse(result);
    } catch {
      summary = null;
    }
  }

  return (
    <section className="max-w-2xl mx-auto bg-white border border-line rounded-lg overflow-hidden">
      <div className="px-7 pt-7 pb-5">
        <div className="text-xs font-bold uppercase tracking-wide text-link mb-1">
          Making Tax Digital · Quarterly update
        </div>
        <h1 className="text-xl font-bold mb-1.5">Complete the MTD bridging workbook</h1>
        <p className="text-sm text-slate-600">
          Download our template, fill in your sales and purchase transactions against your bridging categories, then
          upload it back here. We&apos;ll create invoices for sales, bank transactions for purchases, categorise them,
          and attach any evidence in your FreeAgent account.
        </p>
      </div>

      <div className="px-7 pb-6">
        {summary ? (
          <div className="mb-5 rounded-md border border-line bg-pageBg p-4 text-sm space-y-2">
            <p>
              Created <strong>{summary.invoicesCreated}</strong> invoice(s) and{' '}
              <strong>{summary.transactionsCreated}</strong> transaction(s), explained{' '}
              <strong>{summary.explained}</strong>, attached <strong>{summary.attached}</strong> evidence file(s).
            </p>
            {summary.warnings.length > 0 ? (
              <ul className="list-disc list-inside text-orange">
                {summary.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {/* 1. Download the template */}
        <div className="font-bold text-sm mb-1">1. Download the template</div>
        <div className="flex items-start gap-3 rounded-md bg-pageBg px-4 py-3.5">
          <span>📥</span>
          <div className="flex-1">
            <div className="font-bold text-sm">MTD bridging workbook template</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Sales, purchases and quarterly filing codes tabs, pre-formatted with your bridging categories. Fill it in
              offline, then come back and upload it below.
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <Link
              href="/mtd-csv/view?source=template"
              className="border border-line rounded px-3 py-2 text-xs font-semibold text-link bg-white hover:bg-pageBg"
            >
              View
            </Link>
            <a
              href="/api/mtd-csv/template"
              className="border border-line rounded px-3 py-2 text-xs font-semibold text-link bg-white hover:bg-pageBg"
            >
              Download
            </a>
          </div>
        </div>

        <div className="mt-3 text-right">
          <Link href="/mtd-csv/view?source=uploaded" className="text-xs text-link underline">
            View last uploaded file
          </Link>
        </div>

        <div className="h-px bg-line my-6" />

        <form action="/api/mtd-csv/upload" method="POST" encType="multipart/form-data">
          {/* 2. Bank account */}
          <div className="font-bold text-sm mb-1">2. Choose your bank account</div>
          <p className="text-sm text-slate-500 mb-2">Purchase transactions will be created against this account.</p>
          <select
            id="bankAccount"
            name="bankAccount"
            required
            className="border border-line rounded px-3 py-2 text-sm w-full"
          >
            {bankAccounts.map((account) => (
              <option key={account.url} value={account.url}>
                {account.name ?? account.url}
              </option>
            ))}
          </select>

          <div className="h-px bg-line my-6" />

          {/* 3. Upload completed workbook */}
          <div className="flex items-center gap-2 font-bold text-sm mb-1">
            <span>3. Upload your completed workbook</span>
            <RequiredBadge />
          </div>
          <p className="text-sm text-slate-500">The filled-in template, exported as .xlsx.</p>
          <Dropzone
            id="workbook"
            name="workbook"
            icon="📊"
            title="Drag & drop your completed workbook"
            sub="or click to browse · XLSX · one file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            required
          />

          <div className="h-px bg-line my-6" />

          {/* 4. Evidence */}
          <div className="flex items-center gap-2 font-bold text-sm mb-1">
            <span>4. Supporting evidence</span>
            <OptionalBadge />
          </div>
          <p className="text-sm text-slate-500">
            Receipts or invoices, matched to rows automatically by description/reference/customer/supplier text.
          </p>
          <Dropzone
            id="evidence"
            name="evidence"
            icon="📎"
            title="Drag & drop receipts here"
            sub="or click to browse · JPG, PNG, PDF · multiple files"
            multiple
          />

          <div className="mt-6 flex items-center gap-4 -mx-7 -mb-6 px-7 py-4 border-t border-line bg-pageBg">
            <button type="submit" className="bg-blue text-white text-sm font-semibold px-5 py-2.5 rounded">
              Upload and create invoices &amp; transactions
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
