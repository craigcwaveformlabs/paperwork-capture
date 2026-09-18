import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'FreeAgent MTD Bridging',
  description: 'Create bridging categories and post MTD CSV transactions into a real FreeAgent account',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <header className="bg-[#4C7A2E] text-white border-b border-line">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="font-semibold">FreeAgent MTD Bridging</h1>
            <nav className="flex gap-4 text-sm [&_a]:!text-white [&_a]:hover:opacity-80">
              <Link href="/">Clients</Link>
              <Link href="/connection">Connection</Link>
              <Link href="/categories">Categories</Link>
              <Link href="/mtd-csv">MTD CSV</Link>
              <Link href="/transactions">Transactions</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
