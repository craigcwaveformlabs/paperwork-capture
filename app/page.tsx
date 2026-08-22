import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-white border border-line rounded-lg p-6 space-y-3">
      <h2 className="text-xl font-semibold">Prototype routes</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li><Link href="/banking/1">/banking/1</Link></li>
        <li><Link href="/requests">/requests</Link></li>
        <li><Link href="/smart-capture">/smart-capture</Link></li>
        <li><Link href="/outbox">/outbox</Link></li>
      </ul>
    </div>
  );
}
