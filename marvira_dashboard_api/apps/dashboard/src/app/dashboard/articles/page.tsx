'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react';
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
import { resolveImageUrl } from '@/lib/resolve-image-url';
import {
  ArticleStatus,
  type Article,
  type PaginatedResponse,
} from '@marvira/shared-types';

const MARKETING_URL = (
  process.env.NEXT_PUBLIC_MARKETING_URL || 'http://localhost:3002'
).replace(/\/$/, '');

export default function ArticlesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | ArticleStatus>('');
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, pageSize]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-articles', page, pageSize, debouncedSearch, status],
    queryFn: () =>
      api.get<PaginatedResponse<Article>>(
        `/admin/articles${buildQuery({ page, pageSize, search: debouncedSearch, status })}`,
      ),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status: nextStatus,
    }: {
      id: string;
      status: ArticleStatus;
    }) => api.patch(`/admin/articles/${id}`, { status: nextStatus }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      toast.success(
        variables.status === ArticleStatus.PUBLISHED
          ? 'Article published'
          : 'Article unpublished',
      );
    },
    onError: (_err, variables) =>
      toast.error(
        variables.status === ArticleStatus.PUBLISHED
          ? 'Failed to publish article'
          : 'Failed to unpublish article',
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/articles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      toast.success('Article deleted');
    },
    onError: () => toast.error('Failed to delete article'),
  });

  const articles = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
          <p className="text-muted-foreground">
            Marketing pages that promote events — published articles appear on
            the public Explore page.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/articles/new">
            <Plus className="h-4 w-4" />
            New Article
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>
            All Articles ({data?.total?.toLocaleString() ?? 0})
          </CardTitle>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={status}
              onChange={e => setStatus(e.target.value as '' | ArticleStatus)}>
              <option value="">All statuses</option>
              {Object.values(ArticleStatus).map(s => (
                <option key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by title, place, city..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                {debouncedSearch || status
                  ? 'No articles match your filters.'
                  : 'No articles yet.'}
              </p>
              {!debouncedSearch && !status && (
                <Button asChild className="mt-4">
                  <Link href="/dashboard/articles/new">Create Article</Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Cover</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Place</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className={isFetching ? 'opacity-60' : undefined}>
                  {articles.map(article => (
                    <TableRow key={article.id}>
                      <TableCell>
                        {article.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolveImageUrl(article.coverImage)}
                            alt=""
                            className="h-10 w-14 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-14 rounded bg-muted" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium">{article.title}</p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {article.excerpt}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{article.placeName}</p>
                          {article.city && (
                            <p className="text-xs text-muted-foreground">
                              {article.city}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            article.status === ArticleStatus.PUBLISHED
                              ? 'rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600'
                              : 'rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
                          }>
                          {article.status === ArticleStatus.PUBLISHED
                            ? 'Published'
                            : 'Draft'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(article.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {article.status === ArticleStatus.PUBLISHED ? (
                            <>
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={`${MARKETING_URL}/explore/${article.slug}`}
                                  target="_blank"
                                  rel="noreferrer">
                                  <ExternalLink className="h-3 w-3" />
                                  View
                                </a>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={statusMutation.isPending}
                                onClick={() => {
                                  if (
                                    confirm(
                                      'Unpublish this article? It will disappear from Explore.',
                                    )
                                  ) {
                                    statusMutation.mutate({
                                      id: article.id,
                                      status: ArticleStatus.DRAFT,
                                    });
                                  }
                                }}>
                                <EyeOff className="h-3 w-3" />
                                Unpublish
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={statusMutation.isPending}
                              onClick={() =>
                                statusMutation.mutate({
                                  id: article.id,
                                  status: ArticleStatus.PUBLISHED,
                                })
                              }>
                              <Eye className="h-3 w-3" />
                              Publish
                            </Button>
                          )}
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/articles/${article.id}`}>
                              <Pencil className="h-3 w-3" />
                              Edit
                            </Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm('Delete this article?'))
                                deleteMutation.mutate(article.id);
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
