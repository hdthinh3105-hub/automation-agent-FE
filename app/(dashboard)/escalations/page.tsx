'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, buildQueryString, ApiError } from '@/lib/api-client';
import { EscalationItem, PaginatedResult, ESCALATION_STATUSES } from '@/lib/types';

const ESC_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Đang chờ xử lý',
  ACKNOWLEDGED: 'Agent đã nhận',
  RESOLVED: 'Đã xử lý xong',
};

const ESC_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACKNOWLEDGED: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN');
}

function isOverdue(deadline: string, status: string): boolean {
  return status !== 'RESOLVED' && new Date(deadline).getTime() < Date.now();
}

export default function EscalationsPage() {
  const [result, setResult] = useState<PaginatedResult<EscalationItem> | null>(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const qs = buildQueryString({ status, page, limit: 20 });
      const data = await apiFetch<PaginatedResult<EscalationItem>>(`/escalations${qs}`);
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được danh sách escalation.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  async function handleAcknowledge(id: string): Promise<void> {
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/escalations/${id}/acknowledge`, { method: 'POST' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không nhận được escalation.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleResolve(id: string): Promise<void> {
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/escalations/${id}/resolve`, {
        method: 'PATCH',
        body: { resolutionNote: resolveNote.trim() || undefined },
      });
      setResolveNote('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không giải quyết được escalation.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Escalation</h1>
        <p className="mt-1 text-sm text-gray-500">
          Ticket được chuyển cho nhân viên hỗ trợ — theo dõi SLA và xử lý tại đây.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="">Mọi trạng thái</option>
          {ESCALATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ESC_STATUS_LABELS[s] ?? s}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <th className="px-4 py-3">Lý do</th>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">SLA hạn chót</th>
              <th className="px-4 py-3">Ghi chú giải quyết</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                  Đang tải...
                </td>
              </tr>
            )}
            {!isLoading && result?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                  Không có escalation nào khớp bộ lọc.
                </td>
              </tr>
            )}
            {result?.items.map((esc) => (
              <tr key={esc.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-800">{esc.reason}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/tickets/${esc.ticketId}`}
                    className="font-medium text-brand-600 hover:underline"
                  >
                    {esc.ticketId.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      ESC_STATUS_STYLES[esc.status] ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {ESC_STATUS_LABELS[esc.status] ?? esc.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={isOverdue(esc.slaDeadline, esc.status) ? 'font-medium text-red-600' : 'text-gray-600'}>
                    {formatDate(esc.slaDeadline)}
                    {isOverdue(esc.slaDeadline, esc.status) && ' ⚠️'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {esc.status === 'RESOLVED' ? (
                    esc.resolutionNote || <span className="text-gray-400">—</span>
                  ) : (
                    <input
                      type="text"
                      value={resolveNote}
                      onChange={(e) => setResolveNote(e.target.value)}
                      placeholder="Ghi chú khi giải quyết"
                      className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {esc.status === 'PENDING' && (
                    <button
                      disabled={busyId === esc.id}
                      onClick={() => handleAcknowledge(esc.id)}
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
                    >
                      {busyId === esc.id ? 'Đang xử lý...' : 'Nhận ticket'}
                    </button>
                  )}
                  {esc.status === 'ACKNOWLEDGED' && (
                    <button
                      disabled={busyId === esc.id}
                      onClick={() => handleResolve(esc.id)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {busyId === esc.id ? 'Đang lưu...' : 'Xử lý xong'}
                    </button>
                  )}
                  {esc.status === 'RESOLVED' && <span className="text-xs text-gray-400">—</span>}
                </td>
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
