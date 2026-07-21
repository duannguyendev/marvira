'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Search, Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { PaginatedResponse, PracticeQuestionAdminItem } from '@marvira/shared-types';

export default function PracticePage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'true' | 'false'>('all');
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize, publishedFilter]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-practice', page, pageSize, debouncedSearch, publishedFilter],
    queryFn: () =>
      api.get<PaginatedResponse<PracticeQuestionAdminItem>>(
        `/admin/practice/questions${buildQuery({
          page,
          pageSize,
          search: debouncedSearch,
          published: publishedFilter === 'all' ? undefined : publishedFilter,
        })}`,
      ),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      api.patch(`/admin/practice/questions/${id}/publish`, { isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-practice'] });
      toast.success('Publish status updated');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/practice/questions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-practice'] });
      toast.success('Practice question deleted');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete'),
  });

  const questions = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Practice Questions</h1>
          <p className="text-muted-foreground">
            Community standalone questions for the mobile Practice tab
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/practice/new">
            <Plus className="h-4 w-4" />
            New Practice Question
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Community Pool ({data?.total?.toLocaleString() ?? 0})</CardTitle>
          <div className="flex flex-wrap gap-2">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value as typeof publishedFilter)}>
              <option value="all">All</option>
              <option value="true">Published</option>
              <option value="false">Unpublished</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No community practice questions found.</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/practice/new">Create Practice Question</Link>
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Completions</TableHead>
                    <TableHead>Favorites</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="max-w-xs truncate font-medium">{q.question}</TableCell>
                      <TableCell>{q.creator?.name ?? 'System'}</TableCell>
                      <TableCell>{q.isPublished ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{q.completionCount ?? 0}</TableCell>
                      <TableCell>{q.favoriteCount ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/dashboard/practice/${q.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              publishMutation.mutate({ id: q.id, isPublished: !q.isPublished })
                            }>
                            {q.isPublished ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Delete this practice question?')) {
                                deleteMutation.mutate(q.id);
                              }
                            }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <DataTablePagination
                page={data?.page ?? page}
                pageSize={data?.pageSize ?? pageSize}
                total={data?.total ?? 0}
                totalPages={data?.totalPages ?? 1}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
