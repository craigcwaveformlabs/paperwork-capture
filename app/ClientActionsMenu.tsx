'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export function ClientActionsMenu({ clientName }: { clientName: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 border border-link rounded px-3 py-1.5 text-xs font-semibold text-link bg-white hover:bg-pageBg"
      >
        Actions
        <span aria-hidden>▾</span>
      </button>

      {open ? (
        <div className="absolute right-0 z-10 mt-1 w-52 rounded-md border border-line bg-white shadow-lg py-1">
          <Link
            href={`/mtd-csv?client=${encodeURIComponent(clientName)}`}
            className="block px-3 py-2 text-sm font-medium text-link hover:bg-pageBg"
            onClick={() => setOpen(false)}
          >
            MTD Upload
          </Link>
          <button
            type="button"
            className="block w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-pageBg"
          >
            Send update to HMRC
          </button>
          <button
            type="button"
            className="block w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-pageBg"
          >
            Mark as filed
          </button>
          <button
            type="button"
            className="block w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-pageBg"
          >
            Switch to client&apos;s account
          </button>
        </div>
      ) : null}
    </div>
  );
}
