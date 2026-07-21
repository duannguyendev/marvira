'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryState } from '@/components/query-state';
import type { AnalyticsOverview, EventAnalytics, PracticeStats } from '@marvira/shared-types';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#6A5AE0', '#8F7CFF', '#A78BFA', '#C4B5FD', '#DDD6FE'];

export default function AnalyticsPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['analytics-full'],
    queryFn: () =>
      api.get<{
        overview: AnalyticsOverview;
        events: EventAnalytics[];
        engagement: Array<{ name: string; count: number }>;
        activity: Array<{ date: string; count: number }>;
      }>('/admin/analytics'),
  });

  const practiceQuery = useQuery({
    queryKey: ['practice-stats'],
    queryFn: () => api.get<PracticeStats>('/admin/practice/stats'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Engagement and completion insights</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <QueryState
              isLoading={isLoading}
              isError={isError}
              error={error}
              onRetry={() => refetch()}
              loadingFallback={<Skeleton className="h-[250px] w-full" />}
            >
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary">
                    {data?.overview.completionRate ?? 0}%
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {data?.overview.completedEvents ?? 0} of {data?.overview.activeUsers ?? 0} attempts
                  </p>
                </div>
              </div>
            </QueryState>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement by Event Type</CardTitle>
          </CardHeader>
          <CardContent>
            <QueryState
              isLoading={isLoading}
              isError={isError}
              error={error}
              onRetry={() => refetch()}
              loadingFallback={<Skeleton className="h-[250px] w-full" />}
              isEmpty={!data?.engagement?.length}
              emptyMessage="No engagement data yet."
            >
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data?.engagement ?? []}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {(data?.engagement ?? []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </QueryState>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Community Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <QueryState
              isLoading={practiceQuery.isLoading}
              isError={practiceQuery.isError}
              error={practiceQuery.error}
              onRetry={() => practiceQuery.refetch()}
              loadingFallback={<Skeleton className="h-24 w-full" />}
            >
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">{practiceQuery.data?.totalCommunityQuestions ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Published</span>
                  <span className="font-semibold">
                    {practiceQuery.data?.publishedCommunityQuestions ?? 0}
                  </span>
                </div>
              </div>
            </QueryState>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Practice Completions</CardTitle>
          </CardHeader>
          <CardContent>
            <QueryState
              isLoading={practiceQuery.isLoading}
              isError={practiceQuery.isError}
              error={practiceQuery.error}
              onRetry={() => practiceQuery.refetch()}
              loadingFallback={<Skeleton className="h-24 w-full" />}
            >
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last 7 days</span>
                  <span className="font-semibold">{practiceQuery.data?.completionsLast7Days ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last 30 days</span>
                  <span className="font-semibold">{practiceQuery.data?.completionsLast30Days ?? 0}</span>
                </div>
              </div>
            </QueryState>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Practiced Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <QueryState
              isLoading={practiceQuery.isLoading}
              isError={practiceQuery.isError}
              error={practiceQuery.error}
              onRetry={() => practiceQuery.refetch()}
              loadingFallback={<Skeleton className="h-[200px] w-full" />}
              isEmpty={!practiceQuery.data?.topPracticed?.length}
              emptyMessage="No practice completions yet."
            >
              <ul className="space-y-2 text-sm">
                {(practiceQuery.data?.topPracticed ?? []).map((item, index) => (
                  <li key={item.questionId} className="flex items-start justify-between gap-2">
                    <span className="line-clamp-2 text-muted-foreground">
                      {index + 1}. {item.text}
                    </span>
                    <span className="shrink-0 font-semibold">{item.count}</span>
                  </li>
                ))}
              </ul>
            </QueryState>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Practiced (Chart)</CardTitle>
        </CardHeader>
        <CardContent>
          <QueryState
            isLoading={practiceQuery.isLoading}
            isError={practiceQuery.isError}
            error={practiceQuery.error}
            onRetry={() => practiceQuery.refetch()}
            loadingFallback={<Skeleton className="h-[250px] w-full" />}
            isEmpty={!practiceQuery.data?.topPracticed?.length}
            emptyMessage="No practice data to chart."
          >
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={(practiceQuery.data?.topPracticed ?? []).map((item) => ({
                  name: item.text.length > 24 ? `${item.text.slice(0, 24)}…` : item.text,
                  count: item.count,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 10 }} />
                <YAxis className="text-xs" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#8F7CFF" name="Completions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </QueryState>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <QueryState
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={() => refetch()}
            loadingFallback={<Skeleton className="h-[300px] w-full" />}
            isEmpty={!data?.events?.length}
            emptyMessage="No event performance data yet."
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.events ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="eventTitle" className="text-xs" tick={{ fontSize: 10 }} />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="participants" fill="#6A5AE0" name="Participants" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completions" fill="#8F7CFF" name="Completions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </QueryState>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <QueryState
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={() => refetch()}
            loadingFallback={<Skeleton className="h-[300px] w-full" />}
            isEmpty={!data?.activity?.length}
            emptyMessage="No activity data yet."
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.activity ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#6A5AE0" strokeWidth={2} dot={{ fill: '#6A5AE0' }} />
              </LineChart>
            </ResponsiveContainer>
          </QueryState>
        </CardContent>
      </Card>
    </div>
  );
}
