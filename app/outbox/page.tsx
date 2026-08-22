import Link from 'next/link';
import { ensureSeeded } from '@/lib/repo';
import { dateFmt } from '@/lib/format';

export default function OutboxPage() {
  const db = ensureSeeded();
  const messages = db
    .prepare('SELECT id, recipientEmail, subject, body, uploadLink, createdAt FROM outbox_messages ORDER BY createdAt DESC')
    .all() as Array<{
    id: number;
    recipientEmail: string;
    subject: string;
    body: string;
    uploadLink: string;
    createdAt: string;
  }>;

  return (
    <section className="bg-white border border-line rounded-lg p-4">
      <h2 className="font-semibold text-lg mb-3">Simulated outbox</h2>
      <div className="space-y-3">
        {messages.map((message) => (
          <article key={message.id} className="border border-line rounded p-3 text-sm">
            <div className="flex justify-between">
              <strong>To: {message.recipientEmail}</strong>
              <span>{dateFmt(message.createdAt)}</span>
            </div>
            <div className="mt-1">Subject: {message.subject}</div>
            <pre className="mt-2 whitespace-pre-wrap bg-pageBg p-2 rounded">{message.body}</pre>
            <Link href={message.uploadLink} className="mt-2 inline-block">Upload files</Link>
          </article>
        ))}
        {messages.length === 0 ? <p className="text-sm text-slate-600">No simulated emails yet.</p> : null}
      </div>
    </section>
  );
}
