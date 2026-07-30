'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, buildQueryString, ApiError } from '@/lib/api-client';
import { TicketListItem, PaginatedResult, TICKET_STATUSES, PRIORITY_LEVELS } from '@/lib/types';
import { StatusBadge, PriorityBadge } from '@/components/status-badge';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN');
}

export default function TicketListPage() {
  const [result, setResult] = useState<PaginatedResult<TicketListItem> | null>(null);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const qs = buildQueryString({ status, priority, page, limit: 20 });
        const data = await apiFetch<PaginatedResult<TicketListItem>>(`/tickets${qs}`);
        if (!cancelled) setResult(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Không tải được danh sách ticket.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [status, priority, page]);

  function handleFilterChange(setter: (v: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Danh sách Ticket</h1>
        <p className="mt-1 text-sm text-gray-500">
          {result ? `${result.meta.totalItems} ticket` : 'Đang tải...'}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => handleFilterChange(setStatus, e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="">Mọi trạng thái</option>
          {TICKET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={priority}
          onChange={(e) => handleFilterChange(setPriority, e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="">Mọi mức ưu tiên</option>
          {PRIORITY_LEVELS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <th className="px-4 py-3">Chủ đề</th>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Kênh</th>
              <th className="px-4 py-3">Danh mục</th>
              <th className="px-4 py-3">Ưu tiên</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Tạo lúc</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                  Đang tải...
                </td>
              </tr>
            )}
            {!isLoading && result?.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                  Không có ticket nào khớp bộ lọc.
                </td>
              </tr>
            )}
            {result?.items.map((ticket) => (
              <tr key={ticket.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/tickets/${ticket.id}`} className="font-medium text-brand-600 hover:underline">
                    {ticket.subject}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{ticket.customerEmail}</td>
                <td className="px-4 py-3 text-gray-600">{ticket.channel}</td>
                <td className="px-4 py-3 text-gray-600">{ticket.category ?? '—'}</td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={ticket.priority} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="px-4 py-3 text-gray-500">{formatDate(ticket.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {result && result.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Trang {result.meta.page} / {result.meta.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Trước
            </button>
            <button
              disabled={page >= result.meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}