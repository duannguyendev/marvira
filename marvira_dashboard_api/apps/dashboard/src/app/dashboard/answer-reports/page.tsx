'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AdminAnswerReportRow {
  eventId: string;
  eventTitle: string;
  eventCity: string | null;
  eventIsActive: boolean;
  placeId: string;
  placeTitle: string;
  placeOrderIndex: number;
  reporterCount: number;
  lastReportedAt: string | null;
}

export default function AnswerReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-answer-reports'],
    queryFn: () =>
      api.get<AdminAnswerReportRow[]>('/admin/answer-reports?limit=100'),
  });

  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Wrong-answer reports
        </h1>
        <p className="text-muted-foreground">
          Places players flagged — fix answers from the event editor.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Queue</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No reports yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Place</TableHead>
                  <TableHead className="text-right">Reporters</TableHead>
                  <TableHead>Last reported</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => (
                  <TableRow key={`${row.eventId}-${row.placeId}`}>
                    <TableCell>
                      <p className="font-medium">{row.eventTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.eventCity ?? '—'} ·{' '}
                        {row.eventIsActive ? 'Live' : 'Draft'}
                      </p>
                    </TableCell>
                    <TableCell>
                      {row.placeOrderIndex + 1}. {row.placeTitle}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.reporterCount}
                    </TableCell>
                    <TableCell>
                      {row.lastReportedAt
                        ? new Date(row.lastReportedAt).toLocaleString()
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/events/${row.eventId}`}>
                          Open event
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
