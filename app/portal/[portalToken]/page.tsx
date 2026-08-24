import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ensureSeeded } from '@/lib/repo';
import { getSessionClientId, SESSION_COOKIE_NAME } from '@/lib/clientAuth';

export default async function PortalLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ portalToken: string }>;
  searchParams: Promise<{ requested?: string; error?: string }>;
}) {
  const { portalToken } = await params;
  const { requested, error } = await searchParams;
  const db = ensureSeeded();

  const client = db.prepare('SELECT id, name, email FROM clients WHERE portalToken = ?').get(portalToken) as
    | { id: number; name: string; email: string }
    | undefined;

  if (!client) {
    return <p>Portal link not found.</p>;
  }

  const cookieStore = await cookies();
  const sessionClientId = getSessionClientId(db, cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (sessionClientId === client.id) {
    redirect(`/portal/${portalToken}/home`);
  }

  return (
    <div className="max-w-sm mx-auto bg-white border border-line rounded-lg p-4 space-y-4">
      <h2 className="text-lg font-semibold">Sign in as {client.name}</h2>

      {error ? <p className="text-sm text-red">That code didn&apos;t match or has expired. Try again.</p> : null}

      {requested ? (
        <form action="/api/portal/verify" method="post" className="space-y-2">
          <input type="hidden" name="portalToken" value={portalToken} />
          <p className="text-sm text-slate-700">
            We&apos;ve sent a 6-digit code to {client.email}. Check the simulated outbox.
          </p>
          <input
            name="passcode"
            placeholder="6-digit code"
            className="border border-line rounded px-3 py-2 w-full"
            required
          />
          <button className="bg-green text-greenInk px-3 py-2 rounded font-semibold w-full">Verify code</button>
        </form>
      ) : (
        <form action="/api/portal/request-code" method="post" className="space-y-2">
          <input type="hidden" name="portalToken" value={portalToken} />
          <p className="text-sm text-slate-700">We&apos;ll email a one-time code to {client.email}.</p>
          <button className="bg-blue text-white px-3 py-2 rounded font-semibold w-full">Send login code</button>
        </form>
      )}
    </div>
  );
}
