import type { RequestStatus, TransactionStatus } from '@/lib/types';

const classes: Record<TransactionStatus | RequestStatus, string> = {
  unexplained: 'bg-red/10 text-red border border-red/30',
  for_approval: 'bg-orangeBg text-orange border border-orange/40',
  explained: 'bg-tick/10 text-tick border border-tick/30',
  manually_added: 'bg-slate-200 text-slate-700 border border-slate-300',
  sent: 'bg-blue/10 text-blue border border-blue/20',
  viewed: 'bg-blue/10 text-blue border border-blue/20',
  partial: 'bg-orangeBg text-orange border border-orange/40',
  complete: 'bg-tick/10 text-tick border border-tick/30',
  overdue: 'bg-red/10 text-red border border-red/30',
  blocked_quota: 'bg-red/10 text-red border border-red/30',
};

export function StatusPill({ value }: { value: TransactionStatus | RequestStatus }) {
  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${classes[value]}`}>{value.replace('_', ' ')}</span>;
}
