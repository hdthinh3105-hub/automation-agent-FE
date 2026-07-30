'use client';

import { useEffect, useRef, useState, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import { TicketPublicView } from '@/lib/types';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Đang tiếp nhận',
  CLASSIFIED: 'Đang phân loại',
  WAITING_CUSTOMER: 'Đang chờ bạn bổ sung thông tin',
  ANSWERED: 'Đã có câu trả lời',
  ESCALATED: 'Đã chuyển cho nhân viên hỗ trợ',
  IN_PROGRESS: 'Nhân viên đang xử lý',
  RESOLVED: 'Đã xử lý xong',
  CLOSED: 'Đã đóng',
};

const SENDER_ALIGN: Record<string, string> = {
  CUSTOMER: 'ml-auto bg-brand-600 text-white',
  AI: 'mr-auto bg-emerald-50 text-gray-800 border border-emerald-100',
  AGENT: 'mr-auto bg-white text-gray-800 border border-gray-200',
};

const SENDER_LABELS: Record<string, string> = {
  CUSTOMER: 'Bạn',
  AI: 'Trợ lý AI',
  AGENT: 'Nhân viên hỗ trợ',
};

const POLL_INTERVAL_MS = 4000;

export default function ChatConversationPage() {
  const params = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<TicketPublicView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function fetchTicket(silent = false): Promise<void> {
    if (!silent) setIsLoading(true);
    try {
      const data = await apiFetch<TicketPublicView>(`/tickets/${params.id}/public`);
      setTicket(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được cuộc trò chuyện.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!params.id) return;
    fetchTicket();
    // Polling: chờ AI/Agent trả lời — kênh Web không có WebSocket ở
    // phạm vi Assessment, dùng poll đơn giản mỗi 4s (đủ mượt cho demo).
    const interval = setInterval(() => fetchTicket(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages.length]);

  async function handleSend(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!draft.trim()) return;
    setIsSending(true);
    setError(null);
    try {
      await apiFetch(`/tickets/${params.id}/messages`, {
        method: 'POST',
        body: { content: draft.trim() },
      });
      setDraft('');
      await fetchTicket(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không gửi được tin nhắn.');
    } finally {
      setIsSending(false);
    }
  }

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">Đang tải...</div>;
  }

  if (error && !ticket) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col bg-gray-50">
      <header className="sticky top-0 border-b border-gray-200 bg-white px-5 py-4">
        <h1 className="text-sm font-semibold text-gray-900">{ticket.subject}</h1>
        <p className="mt-0.5 text-xs text-gray-500">
          Trạng thái: {STATUS_LABELS[ticket.status] ?? ticket.status}
        </p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {ticket.messages.map((msg) => (
          <div key={msg.id} className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${SENDER_ALIGN[msg.sender] ?? 'mr-auto bg-white'}`}>
            <p className="mb-0.5 text-[10px] font-semibold uppercase opacity-70">
              {SENDER_LABELS[msg.sender] ?? msg.sender}
            </p>
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mx-5 mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      <form onSubmit={handleSend} className="sticky bottom-0 flex gap-2 border-t border-gray-200 bg-white p-4">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={isSending || !draft.trim()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Gửi
        </button>
      </form>
    </div>
  );
}