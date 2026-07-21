'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search } from 'lucide-react';
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
import { formatDuration } from '@/lib/format-duration';
import type { EventParticipantSortBy, EventParticipantsResponse } from '@marvira/shared-types';

const SORT_OPTIONS: { value: EventParticipantSortBy; label: string }[] = [
  { value: 'fastest', label: 'Fastest finish' },
  { value: 'slowest', label: 'Slowest finish' },
  { value: 'score', label: 'Highest score' },
  { value: 'started', label: 'Recently started' },
  { value: 'name', label: 'Name (A–Z)' },
];

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EventParticipantsPage() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<EventParticipantSortBy>('fastest');
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize, sortBy]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-event-participants', id, page, pageSize, debouncedSearch, sortBy],
    queryFn: () =>
      api.get<EventParticipantsResponse>(
        `/admin/events/${id}/participants${buildQuery({
          page,
          pageSize,
          search: debouncedSearch,
          sortBy,
        })}`,
      ),
  });

  const participants = data?.participants.items ?? [];
  const pagination = data?.participants;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/dashboard/events">
              <ArrowLeft className="h-4 w-4" />
              Back to Events
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Participants</h1>
            {data?.event ? (
              <p className="text-muted-foreground">
                {data.event.title} · {data.event.city}
              </p>
            ) : (
              <p className="text-muted-foreground">Users who joined this event</p>
            )}
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/events/${id}`}>Edit event</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle>
            All participants ({pagination?.total?.toLocaleString() ?? 0})
          </CardTitle>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as EventParticipantSortBy)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Sort: {opt.label}
                </option>
              ))}
            </select>
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
          ) : participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                {debouncedSearch
                  ? 'No participants match your search.'
                  : 'No one has joined this event yet.'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Progress</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Finished</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className={isFetching ? 'opacity-60' : undefined}>
                  {participants.map((p) => (
                    <TableRow key={p.userId}>
                      <TableCell className="font-medium">{p.userName}</TableCell>
                      <TableCell className="text-muted-foreground">{p.userEmail}</TableCell>
                      <TableCell>
                        <span
                          className={
                            p.completed
                              ? 'rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600'
                              : 'rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600'
                          }
                        >
                          {p.completed ? 'Completed' : 'In progress'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {p.placesCompleted}/{p.totalPlaces}
                      </TableCell>
                      <TableCell className="text-right font-medium">{p.score}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDateTime(p.startedAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDateTime(p.completedAt)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {p.completed ? formatDuration(p.totalDurationMs) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {pagination && (
                <DataTablePagination
                  page={pagination.page}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  totalPages={pagination.totalPages}
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
