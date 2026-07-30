'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { OverviewStats, TrendPoint, AiPerformanceStats } from '@/lib/types';
import StatCard from '@/components/stat-card';
import TrendTable from '@/components/trend-table';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Mới',
  CLASSIFIED: 'Đã phân loại',
  WAITING_CUSTOMER: 'Chờ khách bổ sung',
  ANSWERED: 'AI đã trả lời',
  ESCALATED: 'Đã chuyển Agent',
  IN_PROGRESS: 'Agent đang xử lý',
  RESOLVED: 'Đã xử lý xong',
  CLOSED: 'Đã đóng',
};

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export default function DashboardOverviewPage() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [aiPerformance, setAiPerformance] = useState<AiPerformanceStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [overviewData, trendsData] = await Promise.all([
          apiFetch<OverviewStats>('/dashboard/overview'),
          apiFetch<TrendPoint[]>('/dashboard/trends'),
        ]);
        if (cancelled) return;
        setOverview(overviewData);
        setTrends(trendsData);

        // /ai-performance chỉ Admin gọi được — không chặn toàn trang nếu lỗi 403.
        try {
          const aiData = await apiFetch<AiPerformanceStats>('/dashboard/ai-performance');
          if (!cancelled) setAiPerformance(aiData);
        } catch {
          // Agent (không phải Admin) sẽ nhận 403 ở đây — bỏ qua, không hiện lỗi toàn trang.
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Không tải được dữ liệu Dashboard.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>;
  }

  if (error) {
    return <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Tổng quan hệ thống</h1>
        <p className="mt-1 text-sm text-gray-500">Số liệu vận hành theo thời gian thực</p>
      </div>

      {overview && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Tổng số ticket" value={overview.totalTickets.toString()} />
          <StatCard
            label="Tỷ lệ AI tự trả lời"
            value={formatPercent(overview.autoResolveRate)}
            accent="text-green-600"
          />
          <StatCard
            label="Tỷ lệ chuyển Agent"
            value={formatPercent(overview.escalationRate)}
            accent="text-amber-600"
          />
          <StatCard
            label="Confidence trung bình"
            value={
              aiPerformance?.avgConfidence !== null && aiPerformance?.avgConfidence !== undefined
                ? aiPerformance.avgConfidence.toFixed(2)
                : '—'
            }
          />
        </div>
      )}

      {overview && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Ticket theo trạng thái</h2>
            <div className="space-y-2">
              {Object.entries(overview.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{STATUS_LABELS[status] ?? status}</span>
                  <span className="font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Ticket theo mức ưu tiên</h2>
            <div className="space-y-2">
              {Object.entries(overview.byPriority).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{priority}</span>
                  <span className="font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Xu hướng theo ngày (30 ngày gần nhất)</h2>
        <TrendTable trends={trends} />
      </div>
    </div>
  );
}