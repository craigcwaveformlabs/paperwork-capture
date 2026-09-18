import Link from 'next/link';
import { isConnected, apiRequest } from '@/lib/freeagent/client';

type Company = { name: string; subdomain: string; type: string };

export default async function ConnectionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const connected = isConnected();

  let company: Company | null = null;
  if (connected) {
    try {
      const data = await apiRequest<{ company: Company }>('/company');
      company = data.company;
    } catch {
      company = null;
    }
  }

  return (
    <section className="bg-white border border-line rounded-lg overflow-hidden">
      <header className="p-4 border-b border-line">
        <h2 className="font-semibold text-lg">Live FreeAgent connection</h2>
        <p className="text-sm text-slate-600 mt-1">
          A real, OAuth-authenticated connection to your FreeAgent sandbox account — not a simulation.
        </p>
      </header>

      <div className="p-4 space-y-4">
        {error ? (
          <p className="text-sm text-red bg-orangeBg border border-orange rounded p-3">Connection failed: {error}</p>
        ) : null}

        {!connected ? (
          <a
            href="/api/oauth/connect"
            className="inline-block bg-blue text-white text-sm font-medium px-4 py-2 rounded"
          >
            Connect to FreeAgent
          </a>
        ) : (
          <>
            {company ? (
              <p className="text-sm">
                Connected to <span className="font-medium">{company.name}</span>.
              </p>
            ) : (
              <p className="text-sm text-red bg-orangeBg border border-orange rounded p-3">
                A token is stored, but FreeAgent rejected it (expired or revoked). Reconnect below.
              </p>
            )}
            <a
              href="/api/oauth/connect"
              className="inline-block bg-blue text-white text-sm font-medium px-4 py-2 rounded"
            >
              Reconnect to FreeAgent
            </a>
            <div className="flex gap-4 text-sm">
              <Link href="/categories" className="text-link underline">
                Bridging categories
              </Link>
              <Link href="/mtd-csv" className="text-link underline">
                MTD CSV upload
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
