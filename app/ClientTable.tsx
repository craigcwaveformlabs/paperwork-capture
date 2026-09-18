'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ClientSubmission } from '@/lib/mockClients';
import { ClientActionsMenu } from './ClientActionsMenu';

export function ClientTable({ rows }: { rows: ClientSubmission[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allSelected = rows.length > 0 && selectedIds.length === rows.length;

  function toggleRow(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]));
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : rows.map((row) => row.id));
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function requestData() {
    const clientNames = [
      ...new Set(rows.filter((row) => selectedIds.includes(row.id)).map((row) => row.clientName)),
    ];
    router.push(`/request-data?clients=${encodeURIComponent(clientNames.join(','))}`);
  }

  return (
    <>
      {selectedIds.length > 0 ? (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue/5 border-b border-line">
          <strong className="text-sm">
            {selectedIds.length} {selectedIds.length === 1 ? 'client' : 'clients'} selected
          </strong>
          <button
            type="button"
            onClick={requestData}
            className="bg-blue text-white text-xs font-semibold px-3 py-2 rounded"
          >
            📄 Request quarterly data
          </button>
          <button type="button" onClick={clearSelection} className="text-xs text-link underline">
            Clear
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-white text-left">
              <th className="p-3 w-8">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="p-3 font-semibold">Client name</th>
              <th className="p-3 font-semibold">User</th>
              <th className="p-3 font-semibold">Account manager</th>
              <th className="p-3 font-semibold">Submission type</th>
              <th className="p-3 font-semibold">Submission due</th>
              <th className="p-3 font-semibold">Client approval</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-line/60 last:border-b-0 align-top">
                <td className="p-3">
                  <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleRow(row.id)} />
                </td>
                <td className="p-3 font-semibold text-link">{row.clientName}</td>
                <td className="p-3">{row.user}</td>
                <td className="p-3">{row.accountManager}</td>
                <td className="p-3">
                  <div>{row.submissionType}</div>
                  <div className="text-xs text-slate-500">{row.periodLabel}</div>
                </td>
                <td className="p-3">{row.submissionDue}</td>
                <td className="p-3">{row.clientApproval}</td>
                <td className="p-3">
                  <div className="font-semibold text-orange">Due</div>
                  <div className="text-xs text-slate-500">{row.dueStatus}</div>
                </td>
                <td className="p-3 text-right">
                  <ClientActionsMenu clientName={row.clientName} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
