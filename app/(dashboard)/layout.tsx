'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Tổng quan' },
  { href: '/tickets', label: 'Ticket' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col border-r border-gray-200 bg-white px-4 py-6">
        <div className="mb-8 px-2">
          <p className="text-sm font-semibold text-gray-900">AI Customer Support</p>
          <p className="mt-0.5 truncate text-xs text-gray-500">{user.email}</p>
          <span className="mt-1 inline-block rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
            {user.role}
          </span>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={logout}
          className="mt-4 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-500 transition hover:bg-gray-100"
        >
          Đăng xuất
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
    </div>
  );
}