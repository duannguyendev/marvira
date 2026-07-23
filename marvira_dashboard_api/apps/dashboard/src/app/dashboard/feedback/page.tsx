'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Search, MessageSquareText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
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
import {
  FeedbackCategory,
  FeedbackSource,
  FeedbackStatus,
  type FeedbackItem,
  type PaginatedResponse,
} from '@marvira/shared-types';

const STATUS_OPTIONS: Array<{ value: 'all' | FeedbackStatus; label: string }> =
  [
    { value: 'all', label: 'All statuses' },
    { value: FeedbackStatus.NEW, label: 'New' },
    { value: FeedbackStatus.READ, label: 'Read' },
    { value: FeedbackStatus.RESOLVED, label: 'Resolved' },
    { value: FeedbackStatus.ARCHIVED, label: 'Archived' },
  ];

const CATEGORY_OPTIONS: Array<{
  value: 'all' | FeedbackCategory;
  label: string;
}> = [
  { value: 'all', label: 'All categories' },
  { value: FeedbackCategory.FEEDBACK, label: 'Feedback' },
  { value: FeedbackCategory.SUGGESTION, label: 'Suggestion' },
  { value: FeedbackCategory.BUG, label: 'Bug' },
  { value: FeedbackCategory.OTHER, label: 'Other' },
];

const SOURCE_OPTIONS: Array<{ value: 'all' | FeedbackSource; label: string }> =
  [
    { value: 'all', label: 'All sources' },
    { value: FeedbackSource.WEB, label: 'Website' },
    { value: FeedbackSource.MOBILE, label: 'Mobile app' },
  ];

function statusClass(status: FeedbackStatus) {
  switch (status) {
    case FeedbackStatus.NEW:
      return 'bg-primary/10 text-primary';
    case FeedbackStatus.READ:
      return 'bg-muted text-muted-foreground';
    case FeedbackStatus.RESOLVED:
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case FeedbackStatus.ARCHIVED:
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function formatLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export default function FeedbackPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | FeedbackStatus>(
    'all',
  );
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | FeedbackCategory
  >('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | FeedbackSource>(
    'all',
  );
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    pageSize,
    statusFilter,
    categoryFilter,
    sourceFilter,
    dateFrom,
    dateTo,
  ]);

  const { data, isLoading } = useQuery({
    queryKey: [
      'admin-feedback',
      page,
      pageSize,
      debouncedSearch,
      statusFilter,
      categoryFilter,
      sourceFilter,
      dateFrom,
      dateTo,
    ],
    queryFn: () =>
      api.get<PaginatedResponse<FeedbackItem>>(
        `/admin/feedback${buildQuery({
          page,
          pageSize,
          search: debouncedSearch,
          status: statusFilter === 'all' ? undefined : statusFilter,
          category: categoryFilter === 'all' ? undefined : categoryFilter,
          source: sourceFilter === 'all' ? undefined : sourceFilter,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        })}`,
      ),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
        <p className="text-muted-foreground">
          Messages and suggestions from website visitors and app users
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4">
          <CardTitle className="flex items-center gap-2">
            <MessageSquareText className="h-5 w-5" />
            Inbox ({data?.total?.toLocaleString() ?? 0})
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search name, email, subject, message..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={statusFilter}
              onChange={e =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={categoryFilter}
              onChange={e =>
                setCategoryFilter(e.target.value as typeof categoryFilter)
              }>
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={sourceFilter}
              onChange={e =>
                setSourceFilter(e.target.value as typeof sourceFilter)
              }>
              {SOURCE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Input
              type="date"
              className="w-auto"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              title="From date"
            />
            <Input
              type="date"
              className="w-auto"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              title="To date"
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
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                No feedback messages found.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Link
                          href={`/dashboard/feedback/${item.id}`}
                          className="block">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.email}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>{formatLabel(item.category)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {item.subject || item.message.slice(0, 60)}
                      </TableCell>
                      <TableCell>
                        {item.source === FeedbackSource.WEB
                          ? 'Website'
                          : 'Mobile'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(item.status)}`}>
                          {formatLabel(item.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString()}
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
