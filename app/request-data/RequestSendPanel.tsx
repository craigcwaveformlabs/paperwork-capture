'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const SEND_MODES = [
  { key: 'auto' as const, title: 'Automate to MTD schedule', sub: 'Send automatically one week after each quarter ends, every quarter' },
  { key: 'now' as const, title: 'Send once, now', sub: 'Email this request immediately for this quarter only' },
];

export function RequestSendPanel({ clientCount }: { clientCount: number }) {
  const router = useRouter();
  const [sendMode, setSendMode] = useState<'auto' | 'now'>('auto');

  const label =
    (sendMode === 'auto' ? 'Schedule for ' : 'Send to ') +
    clientCount +
    ' ' +
    (clientCount === 1 ? 'client' : 'clients');

  return (
    <>
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">When to send</div>
      <div className="space-y-2">
        {SEND_MODES.map((mode) => {
          const selected = sendMode === mode.key;
          return (
            <button
              key={mode.key}
              type="button"
              onClick={() => setSendMode(mode.key)}
              className={`w-full flex items-start gap-3 text-left rounded-md border px-4 py-3 ${
                selected ? 'border-link bg-blue/5' : 'border-line bg-white'
              }`}
            >
              <span
                className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${
                  selected ? 'border-link' : 'border-line'
                }`}
              >
                {selected ? <span className="w-2 h-2 rounded-full bg-link" /> : null}
              </span>
              <div>
                <div className="font-semibold text-sm">{mode.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{mode.sub}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-4 -mx-7 -mb-6 px-7 py-4 border-t border-line bg-pageBg">
        <button
          type="button"
          onClick={() => router.push(`/?requested=${clientCount}`)}
          className="bg-blue text-white text-sm font-semibold px-5 py-2.5 rounded"
        >
          {label}
        </button>
        <button type="button" onClick={() => router.push('/')} className="text-sm text-link underline">
          Cancel
        </button>
      </div>
    </>
  );
}
