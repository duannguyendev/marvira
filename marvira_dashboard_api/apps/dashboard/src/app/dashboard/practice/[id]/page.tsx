'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { QuestionForm } from '@/features/questions/question-form';
import { api } from '@/services/api';
import type { AdminQuestion } from '@marvira/shared-types';

export default function EditPracticeQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const { data: question, isLoading } = useQuery({
    queryKey: ['admin-practice-question', id],
    queryFn: () => api.get<AdminQuestion>(`/admin/questions/${id}`),
  });

  const publishMutation = useMutation({
    mutationFn: (isPublished: boolean) =>
      api.patch(`/admin/practice/questions/${id}/publish`, { isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-practice'] });
      toast.success('Publish status updated');
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="p-6">
        <p>Question not found.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/practice">Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Practice Question
          </h1>
          <p className="text-muted-foreground">
            Update community practice question
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => publishMutation.mutate(true)}>
            Publish
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/practice">Back</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
        </CardHeader>
        <CardContent>
          <QuestionForm
            question={question}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey: ['admin-practice'] });
              toast.success('Question updated');
            }}
            onCancel={() => window.history.back()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
