'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
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
import type {
  PaginatedResponse,
  QuestionListItem,
} from '@marvira/shared-types';

export default function QuestionsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-questions', page, pageSize, debouncedSearch],
    queryFn: () =>
      api.get<PaginatedResponse<QuestionListItem>>(
        `/admin/questions${buildQuery({ page, pageSize, search: debouncedSearch })}`,
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/questions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
      toast.success('Question deleted');
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Failed to delete question'),
  });

  const questions = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Questions</h1>
          <p className="text-muted-foreground">
            Reusable question bank — link questions to multiple events
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/questions/new">
            <Plus className="h-4 w-4" />
            New Question
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>
            All Questions ({data?.total?.toLocaleString() ?? 0})
          </CardTitle>
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search questions..."
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
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                {debouncedSearch
                  ? 'No questions match your search.'
                  : 'No questions found.'}
              </p>
              {!debouncedSearch && (
                <Button asChild className="mt-4">
                  <Link href="/dashboard/questions/new">Create Question</Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Events</TableHead>
                    <TableHead className="text-right">Places</TableHead>
                    <TableHead>Used in</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className={isFetching ? 'opacity-60' : undefined}>
                  {questions.map(q => (
                    <TableRow key={q.id}>
                      <TableCell>
                        <p className="max-w-md line-clamp-2 font-medium">
                          {q.question}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          {q.type.replace(/_/g, ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{q.points}</TableCell>
                      <TableCell className="text-right">
                        {q._count?.eventQuestions ?? 0}
                      </TableCell>
                      <TableCell className="text-right">
                        {q._count?.places ?? 0}
                      </TableCell>
                      <TableCell>
                        <p className="max-w-xs line-clamp-1 text-xs text-muted-foreground">
                          {q.eventQuestions?.length
                            ? q.eventQuestions
                                .map(eq => eq.event.title)
                                .join(', ')
                            : '—'}
                          {(q._count?.eventQuestions ?? 0) >
                          (q.eventQuestions?.length ?? 0)
                            ? '…'
                            : ''}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/questions/${q.id}`}>
                              <Pencil className="h-3 w-3" />
                              Edit
                            </Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm('Delete this question?'))
                                deleteMutation.mutate(q.id);
                            }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
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
