'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { UserRole } from '@marvira/shared-types';
import type { AnticheatUserListItem, PaginatedResponse, SuspendDuration } from '@marvira/shared-types';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTablePagination } from '@/components/data-table/pagination';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { buildQuery } from '@/lib/build-query';

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isSuspended(user: AnticheatUserListItem) {
  return !!user.playSuspendedUntil && new Date(user.playSuspendedUntil) > new Date();
}

export default function AnticheatPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    if (currentUser && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [currentUser, isAdmin, router]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-anticheat', page, pageSize, debouncedSearch],
    queryFn: () =>
      api.get<PaginatedResponse<AnticheatUserListItem>>(
        `/admin/anticheat/users${buildQuery({ page, pageSize, search: debouncedSearch })}`,
      ),
    enabled: isAdmin,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-anticheat'] });
  };

  const suspendMutation = useMutation({
    mutationFn: ({ id, duration }: { id: string; duration: SuspendDuration }) =>
      api.post(`/admin/anticheat/users/${id}/suspend`, { duration }),
    onSuccess: () => {
      invalidate();
      toast.success('Play suspension applied');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to suspend user'),
  });

  const liftMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/anticheat/users/${id}/lift-suspension`, {}),
    onSuccess: () => {
      invalidate();
      toast.success('Suspension lifted');
    },
  });

  const resetMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/anticheat/users/${id}/reset-warnings`, {}),
    onSuccess: () => {
      invalidate();
      toast.success('Warning points reset');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/anticheat/users/${id}/deactivate`, {}),
    onSuccess: () => {
      invalidate();
      toast.success('Account deactivated');
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/anticheat/users/${id}/activate`, {}),
    onSuccess: () => {
      invalidate();
      toast.success('Account activated');
    },
  });

  const users = data?.items ?? [];

  const handleSuspend = (id: string, duration: SuspendDuration) => {
    if (!confirm(`Suspend this user from playing for ${duration}?`)) return;
    suspendMutation.mutate({ id, duration });
  };

  const handleReset = (id: string) => {
    if (!confirm('Reset warning points to zero for this user?')) return;
    resetMutation.mutate(id);
  };

  const handleDeactivate = (id: string) => {
    if (!confirm('Deactivate this account? The user will not be able to log in.')) return;
    deactivateMutation.mutate(id);
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Anti-Cheat</h1>
        <p className="text-muted-foreground">
          Review users with location warnings and apply moderation actions
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Flagged Users ({data?.total?.toLocaleString() ?? 0})</CardTitle>
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No users found.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Warning pts</TableHead>
                    <TableHead>Last warning</TableHead>
                    <TableHead>Suspended until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className={isFetching ? 'opacity-60' : undefined}>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="text-right font-semibold">{user.warningPoints}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {user.lastWarningCode ? (
                          <span>
                            {user.lastWarningCode}
                            <br />
                            {formatDate(user.lastWarningAt)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(user.playSuspendedUntil)}
                      </TableCell>
                      <TableCell>
                        {!user.isActive ? (
                          <span className="text-destructive">Deactivated</span>
                        ) : isSuspended(user) ? (
                          <span className="text-amber-600">Suspended</span>
                        ) : (
                          <span className="text-green-600">Active</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {user.warningPoints > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReset(user.id)}
                              disabled={resetMutation.isPending}
                            >
                              Reset pts
                            </Button>
                          )}
                          {user.isActive && isSuspended(user) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => liftMutation.mutate(user.id)}
                              disabled={liftMutation.isPending}
                            >
                              Lift
                            </Button>
                          )}
                          {user.isActive && !isSuspended(user) && (
                            <select
                              className="h-8 rounded-md border bg-background px-2 text-xs"
                              defaultValue=""
                              onChange={(e) => {
                                const value = e.target.value as SuspendDuration;
                                if (value) {
                                  handleSuspend(user.id, value);
                                  e.target.value = '';
                                }
                              }}
                            >
                              <option value="">Suspend…</option>
                              <option value="1d">1 day</option>
                              <option value="2d">2 days</option>
                              <option value="1w">1 week</option>
                              <option value="1m">1 month</option>
                            </select>
                          )}
                          {user.isActive ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeactivate(user.id)}
                              disabled={deactivateMutation.isPending}
                            >
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => activateMutation.mutate(user.id)}
                              disabled={activateMutation.isPending}
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data && (
                <DataTablePagination
                  page={data.page}
                  pageSize={data.pageSize}
                  total={data.total}
                  totalPages={data.totalPages}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
