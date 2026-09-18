import { MOCK_SUBMISSIONS } from '@/lib/mockClients';
import { ClientTable } from './ClientTable';

const TABS = [
  { label: 'Ready to file', count: 125, active: true },
  { label: 'Approval required', count: 48 },
  { label: 'In progress' },
  { label: 'Needs attention', count: 21 },
  { label: 'Upcoming' },
  { label: 'Filed' },
] as const;

const FILTERS = [
  'All statuses',
  'All client approval statuses',
  'All my groups',
  'All account managers',
  'Automated and manual',
];

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ requested?: string }>;
}) {
  const { requested } = await searchParams;

  return (
    <section className="bg-white border border-line rounded-lg overflow-hidden">
      {requested ? (
        <div className="p-3 bg-green-50 border-b border-line text-sm text-green-800">
          Quarterly data request sent to <strong>{requested}</strong> {Number(requested) === 1 ? 'client' : 'clients'}.
        </div>
      ) : null}

      <header className="p-4 border-b border-line flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-lg">Making Tax Digital (MTD) for Income Tax</h2>
          <p className="text-sm text-slate-600 mt-1">All clients across every submission period.</p>
        </div>
        <button
          type="button"
          className="border border-line rounded px-3 py-2 text-sm font-semibold text-link bg-white hover:bg-pageBg"
        >
          Export ▾
        </button>
      </header>

      <div className="flex gap-5 border-b border-line px-4">
        {TABS.map((tab) => (
          <span
            key={tab.label}
            className={`flex items-center gap-1.5 py-3 text-sm font-medium border-b-2 -mb-px ${
              'active' in tab && tab.active
                ? 'border-link text-link'
                : 'border-transparent text-slate-500'
            }`}
          >
            {tab.label}
            {'count' in tab && tab.count !== undefined ? (
              <span
                className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-bold ${
                  tab.label === 'Needs attention' ? 'bg-red text-white' : 'bg-pageBg text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            ) : null}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 p-4 bg-pageBg/50">
        {FILTERS.map((filter) => (
          <select key={filter} disabled defaultValue={filter} className="border border-line rounded px-3 py-2 text-sm bg-white text-slate-500">
            <option>{filter}</option>
          </select>
        ))}
        <div className="ml-auto flex gap-2">
          <input
            type="text"
            disabled
            placeholder="Search"
            className="border border-line rounded px-3 py-2 text-sm w-56"
          />
          <button type="button" disabled className="border border-line rounded px-3 py-2 text-sm font-semibold text-link bg-white">
            Search
          </button>
        </div>
      </div>

      <ClientTable rows={MOCK_SUBMISSIONS} />
    </section>
  );
}
