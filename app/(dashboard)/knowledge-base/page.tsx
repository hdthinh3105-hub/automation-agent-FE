'use client';

import { useEffect, useState, FormEvent } from 'react';
import { apiFetch, apiFormFetch, buildQueryString, ApiError } from '@/lib/api-client';
import { KnowledgeDocumentItem, PaginatedResult, DOCUMENT_STATUSES } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

const DOC_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  PROCESSING: 'Đang phân tích',
  READY: 'Sẵn sàng',
  FAILED: 'Lỗi',
};

const DOC_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  READY: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN');
}

export default function KnowledgeBasePage() {
  const { user } = useAuth();
  const [result, setResult] = useState<PaginatedResult<KnowledgeDocumentItem> | null>(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Upload form
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const qs = buildQueryString({ status, page, limit: 20 });
      const data = await apiFetch<PaginatedResult<KnowledgeDocumentItem>>(`/kb/documents${qs}`);
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được danh sách tài liệu.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  async function handleUpload(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!file) {
      setUploadError('Vui lòng chọn file để upload.');
      return;
    }
    setUploadError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim() || file.name);
      formData.append('tags', tags.trim());
      await apiFormFetch<KnowledgeDocumentItem>('/kb/documents', formData);
      setTitle('');
      setTags('');
      setFile(null);
      setPage(1);
      await load();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Upload thất bại.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    if (!window.confirm('Xoá tài liệu này khỏi Knowledge Base?')) return;
    try {
      await apiFetch(`/kb/documents/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không xoá được tài liệu.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Knowledge Base</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tài liệu nguồn cho RAG — AI tra cứu ở đây để trả lời khách hàng.
        </p>
      </div>

      <form
        onSubmit={handleUpload}
        className="rounded-xl border border-gray-200 bg-white p-5"
      >
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Upload tài liệu mới</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tiêu đề (mặc định = tên file)"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags, cách nhau bởi dấu phẩy"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <input
            type="file"
            required
            accept=".pdf,.docx,.txt,.md"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-brand-700"
          />
        </div>
        {uploadError && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{uploadError}</div>
        )}
        <button
          type="submit"
          disabled={isUploading}
          className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? 'Đang upload...' : 'Upload'}
        </button>
      </form>

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
          {DOCUMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {DOC_STATUS_LABELS[s] ?? s}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <th className="px-4 py-3">Tiêu đề</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Phiên bản</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3">Tạo lúc</th>
              {user?.role === 'ADMIN' && <th className="px-4 py-3" />}
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
                  Chưa có tài liệu nào trong Knowledge Base.
                </td>
              </tr>
            )}
            {result?.items.map((doc) => (
              <tr key={doc.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{doc.title}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      DOC_STATUS_STYLES[doc.status] ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {DOC_STATUS_LABELS[doc.status] ?? doc.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">v{doc.version}</td>
                <td className="px-4 py-3">
                  {doc.tags.length === 0 ? (
                    <span className="text-gray-400">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{formatDate(doc.createdAt)}</td>
                {user?.role === 'ADMIN' && (
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Xoá
                    </button>
                  </td>
                )}
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
