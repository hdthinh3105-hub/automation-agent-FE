'use client';

import { useEffect, useState, FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { UserItem, PaginatedResult } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  AGENT: 'Agent',
  VIEWER: 'Viewer',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN');
}

export default function UsersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [result, setResult] = useState<PaginatedResult<UserItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Create agent form (admin only)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('AGENT');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Change own password (any role)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function load() {
    if (!isAdmin) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<PaginatedResult<UserItem>>('/users?limit=100');
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được danh sách người dùng.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function handleCreateUser(e: FormEvent): Promise<void> {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);
    try {
      await apiFetch<UserItem>('/users', {
        method: 'POST',
        body: { email, password, role },
      });
      setEmail('');
      setPassword('');
      setRole('AGENT');
      await load();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Không tạo được tài khoản.');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleChangePassword(e: FormEvent): Promise<void> {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMsg(null);
    setIsChanging(true);
    try {
      await apiFetch('/users/me/password', {
        method: 'PATCH',
        body: { currentPassword, newPassword },
      });
      setCurrentPassword('');
      setNewPassword('');
      setPasswordMsg('Đổi mật khẩu thành công.');
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : 'Không đổi được mật khẩu.');
    } finally {
      setIsChanging(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Người dùng &amp; tài khoản</h1>
        <p className="mt-1 text-sm text-gray-500">
          {isAdmin ? 'Quản lý nhân viên hỗ trợ và quyền truy cập.' : 'Đổi mật khẩu của bạn.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {isAdmin && (
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Tạo tài khoản mới</h2>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu (tối thiểu 8 ký tự)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="AGENT">Agent</option>
                <option value="ADMIN">Admin</option>
                <option value="VIEWER">Viewer</option>
              </select>
              {createError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{createError}</div>
              )}
              <button
                type="submit"
                disabled={isCreating}
                className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreating ? 'Đang tạo...' : 'Tạo tài khoản'}
              </button>
            </form>
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Đổi mật khẩu của bạn</h2>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Mật khẩu hiện tại"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
            {passwordMsg && (
              <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {passwordMsg}
              </div>
            )}
            {passwordError && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{passwordError}</div>
            )}
            <button
              type="submit"
              disabled={isChanging}
              className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isChanging ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </button>
          </form>
        </div>
      </div>

      {isAdmin && (
        <>
          {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Vai trò</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Tạo lúc</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                      Đang tải...
                    </td>
                  </tr>
                )}
                {!isLoading && result?.items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                      Chưa có người dùng nào.
                    </td>
                  </tr>
                )}
                {result?.items.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <span className="text-emerald-600">Hoạt động</span>
                      ) : (
                        <span className="text-gray-400">Không hoạt động</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}