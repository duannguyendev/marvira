'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { QuestionForm } from '@/features/questions/question-form';
import type { QuestionDetail } from '@marvira/shared-types';

export default function EditQuestionPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: question, isLoading } = useQuery({
    queryKey: ['admin-question', id],
    queryFn: () => api.get<QuestionDetail>(`/admin/questions/${id}`),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!question) {
    return <p>Question not found</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Question</h1>
          <p className="text-muted-foreground line-clamp-2">{question.question}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/questions">Back</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
        </CardHeader>
        <CardContent>
          <QuestionForm
            question={question}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey: ['admin-question', id] });
              queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
            }}
          />
        </CardContent>
      </Card>

      {question.eventQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Used in Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {question.eventQuestions.map((eq) => (
              <div key={eq.id} className="flex items-center justify-between text-sm">
                <Link
                  href={`/dashboard/events/${eq.event.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {eq.event.title}
                </Link>
                <span className="text-muted-foreground">{eq.event.city}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
