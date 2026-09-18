import Link from 'next/link';
import { MOCK_SUBMISSIONS } from '@/lib/mockClients';
import { RequestSendPanel } from './RequestSendPanel';

const REQUEST_ITEMS = [
  { icon: '📝', title: 'Quarterly income & expenses', sub: 'Entered on the MTD upload site — no spreadsheet needed' },
  { icon: '📎', title: 'Receipts (optional)', sub: 'Drag-and-drop photos or PDFs — sent to Files & Smart Capture' },
];

export default async function RequestDataPage({
  searchParams,
}: {
  searchParams: Promise<{ clients?: string }>;
}) {
  const { clients: clientsParam } = await searchParams;
  const names = clientsParam ? clientsParam.split(',').filter(Boolean) : [];

  const clients = names
    .map((name) => MOCK_SUBMISSIONS.find((row) => row.clientName === name))
    .filter((row): row is (typeof MOCK_SUBMISSIONS)[number] => Boolean(row));

  return (
    <section className="max-w-2xl mx-auto bg-white border border-line rounded-lg overflow-hidden">
      <div className="px-7 pt-7 pb-5">
        <div className="flex items-center gap-2 text-xs mb-3">
          <Link href="/" className="text-link underline">
            ‹ Back to clients
          </Link>
        </div>
        <div className="text-xs font-bold uppercase tracking-wide text-link mb-1">
          Making Tax Digital · Quarterly update
        </div>
        <h1 className="text-xl font-bold mb-1.5">Request quarterly data</h1>
        <p className="text-sm text-slate-600">
          {clients.length} {clients.length === 1 ? 'client' : 'clients'} · self-employment
        </p>
      </div>

      <div className="px-7 pb-6">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Clients will complete on the MTD upload site
          </div>
          <Link href="/mtd-csv/view?source=template" className="text-xs text-link underline shrink-0">
            Preview template
          </Link>
        </div>
        <div className="rounded-md border border-line divide-y divide-line mb-6">
          {REQUEST_ITEMS.map((item) => (
            <div key={item.title} className="flex items-start gap-3 px-4 py-3">
              <span>{item.icon}</span>
              <div>
                <div className="font-semibold text-sm">{item.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Sending to</div>
        <div className="rounded-md border border-line divide-y divide-line mb-6">
          {clients.map((client) => (
            <div key={client.clientName} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="font-semibold text-sm">{client.clientName}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {client.user} · {client.email}
                </div>
              </div>
              <span className="inline-flex items-center px-2 h-5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                Sole trader
              </span>
            </div>
          ))}
        </div>

        <RequestSendPanel clientCount={clients.length} />
      </div>
    </section>
  );
}
