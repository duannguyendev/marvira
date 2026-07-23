'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { UserRole } from '@marvira/shared-types';
import type { PaginatedResponse } from '@marvira/shared-types';
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
import { AddUserDialog } from '@/features/users/add-user-dialog';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole | string;
  isActive: boolean;
  createdAt: string;
  _count: { eventProgress: number };
}

const ROLE_OPTIONS = [UserRole.USER, UserRole.STAFF, UserRole.ADMIN] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore(s => s.user);
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const canCreateUsers =
    currentUser?.role === UserRole.ADMIN ||
    currentUser?.role === UserRole.STAFF;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-users', page, pageSize, debouncedSearch],
    queryFn: () =>
      api.get<PaginatedResponse<AdminUser>>(
        `/admin/users${buildQuery({ page, pageSize, search: debouncedSearch })}`,
      ),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, activate }: { id: string; activate: boolean }) =>
      api.patch(`/admin/users/${id}/${activate ? 'activate' : 'deactivate'}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User updated');
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Failed to update user'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Role updated');
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Failed to update role'),
  });

  const users = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? 'Manage platform users, roles, and access'
              : 'View and create users (role and status changes require Admin)'}
          </p>
        </div>
        {canCreateUsers && (
          <AddUserDialog
            isAdmin={isAdmin}
            onCreated={() =>
              queryClient.invalidateQueries({ queryKey: ['admin-users'] })
            }
          />
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>
            All Users ({data?.total?.toLocaleString() ?? 0})
          </CardTitle>
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
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
              <p className="text-muted-foreground">
                {debouncedSearch
                  ? 'No users match your search.'
                  : 'No users found.'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Events played</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody className={isFetching ? 'opacity-60' : undefined}>
                  {users.map(user => {
                    const isSelf = user.id === currentUser?.id;
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {isAdmin && !isSelf ? (
                            <select
                              className="rounded-md border bg-background px-2 py-1 text-xs"
                              value={user.role}
                              disabled={roleMutation.isPending}
                              onChange={e =>
                                roleMutation.mutate({
                                  id: user.id,
                                  role: e.target.value as UserRole,
                                })
                              }>
                              {ROLE_OPTIONS.map(role => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                              {user.role}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {user._count.eventProgress}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              user.isActive
                                ? 'text-green-500'
                                : 'text-destructive'
                            }>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            {user.role !== UserRole.ADMIN && !isSelf && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  toggleMutation.mutate({
                                    id: user.id,
                                    activate: !user.isActive,
                                  })
                                }>
                                {user.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
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
