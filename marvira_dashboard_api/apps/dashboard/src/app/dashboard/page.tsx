'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, Map, Trophy, TrendingUp } from 'lucide-react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryState } from '@/components/query-state';
import type { AnalyticsOverview } from '@marvira/shared-types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () =>
      api.get<{
        overview: AnalyticsOverview;
        activity: Array<{ date: string; count: number }>;
      }>('/admin/analytics'),
  });

  const overview = data?.overview;
  const activity = data?.activity ?? [];

  const stats = [
    { label: 'Total Users', value: overview?.totalUsers, icon: Users },
    { label: 'Active Users', value: overview?.activeUsers, icon: TrendingUp },
    { label: 'Active Events', value: overview?.totalEvents, icon: Map },
    { label: 'Completions', value: overview?.completedEvents, icon: Trophy },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and key metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value ?? 0}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <QueryState
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={() => refetch()}
            loadingFallback={<Skeleton className="h-[300px] w-full" />}
            isEmpty={!activity.length}
            emptyMessage="No recent activity."
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activity}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </QueryState>
        </CardContent>
      </Card>
    </div>
  );
}
