'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import { TicketDetail } from '@/lib/types';
import { getValidNextStatuses } from '@/lib/ticket-transitions';
import { StatusBadge, PriorityBadge } from '@/components/status-badge';
import TransitionTable from '@/components/transition-table';
import { useAuth } from '@/lib/auth-context';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN');
}

const SENDER_STYLES: Record<string, string> = {
  CUSTOMER: 'bg-white border border-gray-200',
  AGENT: 'bg-brand-50 border border-brand-100',
  AI: 'bg-emerald-50 border border-emerald-100',
};

const SENDER_LABELS: Record<string, string> = {
  CUSTOMER: 'Khách hàng',
  AGENT: 'Agent',
  AI: 'AI',
};

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [nextStatus, setNextStatus] = useState('');
  const [reason, setReason] = useState('');

  async function loadTicket() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<TicketDetail>(`/tickets/${params.id}`);
      setTicket(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được chi tiết ticket.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (params.id) loadTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleStatusUpdate(): Promise<void> {
    if (!nextStatus) return;
    setIsUpdating(true);
    setError(null);
    try {
      await apiFetch(`/tickets/${params.id}/status`, {
        method: 'PATCH',
        body: { status: nextStatus, reason: reason || undefined },
      });
      setNextStatus('');
      setReason('');
      await loadTicket();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không đổi được trạng thái ticket.');
    } finally {
      setIsUpdating(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-gray-500">Đang tải...</p>;
  }

  if (error && !ticket) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.push('/tickets')} className="text-sm text-brand-600 hover:underline">
          ← Quay lại danh sách
        </button>
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!ticket) return null;

  const validNextStatuses = getValidNextStatuses(ticket.status);

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => router.push('/tickets')} className="text-sm text-brand-600 hover:underline">
          ← Quay lại danh sách
        </button>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">{ticket.subject}</h1>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          {ticket.isSpam && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
              SPAM
            </span>
          )}
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cột trái: thông tin + đổi trạng thái + bảng ma trận */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Thông tin ticket</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Khách hàng</dt>
                <dd className="text-gray-900">{ticket.customerEmail}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Kênh</dt>
                <dd className="text-gray-900">{ticket.channel}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Danh mục</dt>
                <dd className="text-gray-900">{ticket.category ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Confidence</dt>
                <dd className="text-gray-900">
                  {ticket.confidenceScore !== null ? ticket.confidenceScore.toFixed(2) : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Tạo lúc</dt>
                <dd className="text-gray-900">{formatDate(ticket.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Cập nhật lúc</dt>
                <dd className="text-gray-900">{formatDate(ticket.updatedAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Xử lý xong lúc</dt>
                <dd className="text-gray-900">{formatDate(ticket.resolvedAt)}</dd>
              </div>
            </dl>

            {ticket.missingInfoFlags.length > 0 && (
              <div className="mt-4 rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                Thiếu thông tin: {ticket.missingInfoFlags.join(', ')}
              </div>
            )}
          </div>

          {(user?.role === 'AGENT' || user?.role === 'ADMIN') && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-gray-900">Đổi trạng thái</h2>

              {validNextStatuses.length === 0 ? (
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                  Ticket đã ở trạng thái cuối (CLOSED) — không thể chuyển đi đâu được nữa.
                </p>
              ) : (
                <>
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                  >
                    <option value="">Chọn trạng thái mới</option>
                    {/* CHỈ hiện transition hợp lệ theo State Machine (TDD
                        Mục 9) — tránh Agent bấm rồi ăn lỗi 409 vô ích. */}
                    {validNextStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Lý do (tuỳ chọn)"
                    className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                  />
                  <button
                    onClick={handleStatusUpdate}
                    disabled={!nextStatus || isUpdating}
                    className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isUpdating ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
                  </button>
                </>
              )}
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Ma trận chuyển trạng thái</h2>
            <TransitionTable currentStatus={ticket.status} />
          </div>
        </div>

        {/* Cột phải: hội thoại + timeline */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Hội thoại</h2>
            {ticket.messages.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có tin nhắn.</p>
            ) : (
              <div className="space-y-3">
                {ticket.messages.map((msg) => (
                  <div key={msg.id} className={`rounded-lg p-3 ${SENDER_STYLES[msg.sender] ?? ''}`}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700">
                        {SENDER_LABELS[msg.sender] ?? msg.sender}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(msg.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-gray-800">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Lịch sử chuyển trạng thái</h2>
            {ticket.timeline.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có lịch sử.</p>
            ) : (
              <ol className="relative space-y-4 border-l border-gray-200 pl-4">
                {ticket.timeline.map((entry, idx) => (
                  <li key={idx} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <StatusBadge status={entry.fromStatus} />
                      <span className="text-gray-400">→</span>
                      <StatusBadge status={entry.toStatus} />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {entry.changedBy} • {formatDate(entry.changedAt)}
                      {entry.reason ? ` • ${entry.reason}` : ''}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}