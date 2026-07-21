'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FeedbackStatus,
  type FeedbackItem,
} from '@marvira/shared-types';

const STATUS_OPTIONS = [
  FeedbackStatus.NEW,
  FeedbackStatus.READ,
  FeedbackStatus.RESOLVED,
  FeedbackStatus.ARCHIVED,
];

function formatLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export default function FeedbackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<FeedbackStatus>(FeedbackStatus.NEW);
  const [adminNote, setAdminNote] = useState('');

  const { data: feedback, isLoading } = useQuery({
    queryKey: ['admin-feedback', id],
    queryFn: () => api.get<FeedbackItem>(`/admin/feedback/${id}`),
  });

  useEffect(() => {
    if (feedback) {
      setStatus(feedback.status);
      setAdminNote(feedback.adminNote ?? '');
    }
  }, [feedback]);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.patch<FeedbackItem>(`/admin/feedback/${id}`, {
        status,
        adminNote: adminNote.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      toast.success('Feedback updated');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update'),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!feedback) {
    return <p>Feedback not found</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feedback Detail</h1>
          <p className="text-muted-foreground">
            From {feedback.name} · {new Date(feedback.createdAt).toLocaleString()}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/feedback">Back</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{feedback.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{feedback.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="font-medium">{formatLabel(feedback.category)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Source</p>
              <p className="font-medium">{feedback.source === 'WEB' ? 'Website' : 'Mobile app'}</p>
            </div>
          </div>

          {feedback.subject ? (
            <div>
              <p className="text-sm text-muted-foreground">Subject</p>
              <p className="font-medium">{feedback.subject}</p>
            </div>
          ) : null}

          <div>
            <p className="text-sm text-muted-foreground">Message</p>
            <p className="mt-1 whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm">
              {feedback.message}
            </p>
          </div>

          {feedback.user ? (
            <div>
              <p className="text-sm text-muted-foreground">Linked account</p>
              <p className="font-medium">
                {feedback.user.name} ({feedback.user.email})
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Staff actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as FeedbackStatus)}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {formatLabel(opt)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminNote">Internal note</Label>
            <textarea
              id="adminNote"
              className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Notes for staff (not visible to user)"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />
          </div>

          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
