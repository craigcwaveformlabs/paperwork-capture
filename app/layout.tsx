import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Paperwork Capture Prototype',
  description: 'Accountant to client paperwork request loop prototype',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <header className="bg-navy text-white border-b border-line">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="font-semibold">Paperwork Capture</h1>
            <nav className="flex gap-4 text-sm">
              <Link href="/">Dashboard</Link>
              <Link href="/banking/1">Banking</Link>
              <Link href="/requests">Requests</Link>
              <Link href="/mtd/1">MTD</Link>
              <Link href="/smart-capture">Smart Capture</Link>
              <Link href="/outbox">Outbox</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
