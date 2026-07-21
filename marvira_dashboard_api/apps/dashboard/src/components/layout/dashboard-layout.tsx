'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isDashboardRole } from '@marvira/shared-types';
import { useAuthStore } from '@/store/auth-store';
import { Sidebar } from '@/components/layout/sidebar';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user, fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe().then(() => {
      const state = useAuthStore.getState();
      if (!state.isAuthenticated) {
        router.replace('/login');
      } else if (!state.user || !isDashboardRole(state.user.role)) {
        router.replace('/login');
      }
    });
  }, [fetchMe, router]);

  if (!isAuthenticated || !user || !isDashboardRole(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64">
        <div className="container mx-auto p-6 pt-16 lg:pt-6">{children}</div>
      </main>
    </div>
  );
}
