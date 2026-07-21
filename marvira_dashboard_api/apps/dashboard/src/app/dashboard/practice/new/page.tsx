'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuestionForm } from '@/features/questions/question-form';

export default function NewPracticeQuestionPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Practice Question</h1>
          <p className="text-muted-foreground">Published to the mobile Practice community pool</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/practice">Back</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
        </CardHeader>
        <CardContent>
          <QuestionForm
            apiBasePath="/practice/questions"
            onSaved={() => router.push('/dashboard/practice')}
            onCancel={() => router.push('/dashboard/practice')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
