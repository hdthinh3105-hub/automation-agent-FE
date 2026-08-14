'use client';

import { useEffect, useState } from 'react';
import { apiFetch, buildQueryString, ApiError } from '@/lib/api-client';
import { AuditLogItem, PaginatedResult } from '@/lib/types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN');
}

export default function AuditLogsPage() {
  const [result, setResult] = useState<PaginatedResult<AuditLogItem> | null>(null);
  const [resourceType, setResourceType] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const qs = buildQueryString({ resourceType, page, limit: 20 });
      const data = await apiFetch<PaginatedResult<AuditLogItem>>(`/admin/audit-logs${qs}`);
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được audit log.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceType, page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-500">
          Toàn bộ sự kiện thay đổi tài nguyên trong hệ thống (chỉ Admin).
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={resourceType}
          onChange={(e) => {
            setResourceType(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="">Mọi loại tài nguyên</option>
          {['Ticket', 'Escalation', 'KnowledgeDocument', 'User', 'Unknown'].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Hành động</th>
              <th className="px-4 py-3">Tài nguyên</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Thay đổi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                  Đang tải...
                </td>
              </tr>
            )}
            {!isLoading && result?.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                  Chưa có audit log nào.
                </td>
              </tr>
            )}
            {result?.items.map((log) => (
              <tr key={log.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                  {formatDate(log.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-medium text-gray-900">{log.action}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {log.resourceType}
                  <span className="ml-1 font-mono text-xs text-gray-400">#{log.resourceId.slice(0, 8)}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {log.actorType}
                  {log.actorId ? (
                    <span className="ml-1 font-mono text-xs text-gray-400">#{log.actorId.slice(0, 8)}</span>
                  ) : null}
                </td>
                <td className="max-w-xs px-4 py-3">
                  {log.changesJson ? (
                    <details>
                      <summary className="cursor-pointer text-xs text-brand-600 hover:underline">
                        Xem chi tiết
                      </summary>
                      <pre className="mt-2 max-h-40 overflow-auto rounded bg-gray-50 p-2 text-[10px] text-gray-600">
                        {JSON.stringify(log.changesJson, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
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