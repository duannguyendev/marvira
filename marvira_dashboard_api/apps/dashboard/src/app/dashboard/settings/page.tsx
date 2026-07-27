'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AppSettings } from '@marvira/shared-types';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [days, setDays] = useState('2');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get<AppSettings>('/admin/settings'),
  });

  useEffect(() => {
    if (data?.eventLiveDurationDays != null) {
      setDays(String(data.eventLiveDurationDays));
    }
  }, [data?.eventLiveDurationDays]);

  const saveMutation = useMutation({
    mutationFn: (eventLiveDurationDays: number) =>
      api.patch<AppSettings>('/admin/settings', { eventLiveDurationDays }),
    onSuccess: result => {
      queryClient.setQueryData(['admin-settings'], result);
      setDays(String(result.eventLiveDurationDays));
      toast.success('Settings saved');
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Failed to save settings'),
  });

  const handleSave = () => {
    const parsed = Number.parseInt(days, 10);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 3650) {
      toast.error('Enter a whole number of days between 1 and 3650');
      return;
    }
    saveMutation.mutate(parsed);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Global product settings for Admin and Staff
          </p>
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-destructive">
          {(error as Error)?.message || 'Failed to load settings'}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Global product settings for Admin and Staff
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Event live duration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            After an event is published (or a schedule goes live), it stays in
            public search for this many days, then auto-ends. Owners can still
            end sooner from My Events. Changing this only affects events that
            go live after you save.
          </p>
          <div className="space-y-2">
            <Label htmlFor="eventLiveDurationDays">Days</Label>
            <Input
              id="eventLiveDurationDays"
              type="number"
              min={1}
              max={3650}
              step={1}
              value={days}
              onChange={e => setDays(e.target.value)}
              className="max-w-[160px]"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
