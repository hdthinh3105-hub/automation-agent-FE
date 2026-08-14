'use client';

import { useState, FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { RagAnswer } from '@/lib/types';

export default function RagQueryPage() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<RagAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!query.trim()) return;
    setError(null);
    setAnswer(null);
    setIsLoading(true);
    try {
      const data = await apiFetch<RagAnswer>('/rag/query', {
        method: 'POST',
        body: { query: query.trim() },
      });
      setAnswer(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không chạy được pipeline RAG.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Test RAG pipeline</h1>
        <p className="mt-1 text-sm text-gray-500">
          Chạy thử retrieval + generation với câu hỏi bất kỳ, xem câu trả lời và trích dẫn nguồn.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5">
        <label className="mb-1 block text-sm font-medium text-gray-700">Câu hỏi</label>
        <textarea
          required
          rows={3}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="VD: Chính sách đổi trả hàng của shop như thế nào?"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <div className="mt-3 flex items-center justify-between">
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Đang tra cứu...' : 'Tra cứu'}
          </button>
        </div>
      </form>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {answer && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h2 className="text-sm font-semibold text-gray-900">Câu trả lời</h2>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                {answer.provider} / {answer.model}
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                {answer.latencyMs}ms
              </span>
              {answer.needsEscalation && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  Cần chuyển Agent
                </span>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm text-gray-800">{answer.answer}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Confidence breakdown</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Top similarity</span>
                <span className="font-medium text-gray-900">
                  {(answer.confidenceBreakdown.avgTopSimilarity * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Retrieval coverage</span>
                <span className="font-medium text-gray-900">
                  {(answer.confidenceBreakdown.retrievalCoverage * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">LLM self-score</span>
                <span className="font-medium text-gray-900">
                  {(answer.confidenceBreakdown.llmSelfScore * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2">
                <span className="text-gray-500">Tổng confidence</span>
                <span className="font-semibold text-gray-900">
                  {(answer.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">
              Trích dẫn nguồn ({answer.citations.length})
            </h2>
            {answer.citations.length === 0 ? (
              <p className="text-sm text-gray-500">Không có trích dẫn — có thể cần bổ sung Knowledge Base.</p>
            ) : (
              <div className="space-y-2">
                {answer.citations.map((c) => (
                  <div key={c.chunkId} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <span className="mr-2 inline-block rounded bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-700">
                      [{c.index}]
                    </span>
                    <span className="font-medium text-gray-900">{c.documentTitle}</span>
                    {c.section && <span className="ml-1 text-gray-500">— {c.section}</span>}
                    <span className="ml-1 font-mono text-xs text-gray-400">#{c.chunkId.slice(0, 8)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}