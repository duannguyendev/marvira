'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuestionForm } from '@/features/questions/question-form';

export default function NewQuestionPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Question</h1>
          <p className="text-muted-foreground">Create a reusable question for your events</p>
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
            onSaved={(q) => router.push(`/dashboard/questions/${q.id}`)}
            onCancel={() => router.push('/dashboard/questions')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
