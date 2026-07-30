const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-700',
  CLASSIFIED: 'bg-blue-100 text-blue-700',
  WAITING_CUSTOMER: 'bg-yellow-100 text-yellow-700',
  ANSWERED: 'bg-green-100 text-green-700',
  ESCALATED: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-gray-200 text-gray-600',
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700'
      }`}
    >
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string | null }) {
  if (!priority) return <span className="text-xs text-gray-400">—</span>;
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        PRIORITY_STYLES[priority] ?? 'bg-gray-100 text-gray-700'
      }`}
    >
      {priority}
    </span>
  );
}