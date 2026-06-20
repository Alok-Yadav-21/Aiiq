// Shared status/priority badge styles for the support-request UI.
export const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  SUBMITTED: 'bg-allq-cyan/15 text-allq-cyan border-allq-cyan/30',
  ASSIGNED: 'bg-allq-purple/15 text-allq-purple border-allq-purple/30',
  VIEWED: 'bg-allq-purple/15 text-allq-purple border-allq-purple/30',
  IN_PROGRESS: 'bg-allq-amber/15 text-allq-amber border-allq-amber/30',
  ANSWERED: 'bg-allq-green/15 text-allq-green border-allq-green/30',
  NEEDS_INFO: 'bg-allq-amber/15 text-allq-amber border-allq-amber/30',
  RESOLVED: 'bg-allq-green/15 text-allq-green border-allq-green/30',
  CLOSED: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

export const PRIORITY_BADGE: Record<string, string> = {
  LOW: 'text-slate-400',
  NORMAL: 'text-slate-300',
  HIGH: 'text-allq-amber',
  URGENT: 'text-allq-red',
}
