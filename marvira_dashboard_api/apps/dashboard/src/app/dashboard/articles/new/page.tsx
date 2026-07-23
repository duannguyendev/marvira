'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArticleForm } from '@/features/articles/article-form';
import type { Article, CreateArticleDto } from '@marvira/shared-types';

export default function NewArticlePage() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (payload: CreateArticleDto) =>
      api.post<Article>('/admin/articles', payload),
    onSuccess: article => {
      toast.success('Article created');
      router.push(`/dashboard/articles/${article.id}`);
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Failed to create article'),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Article</h1>
        <p className="text-muted-foreground">
          Write a marketing page to promote an event and share it on social
          media.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Article Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ArticleForm
            submitLabel="Create Article"
            submitting={mutation.isPending}
            onSubmit={payload => mutation.mutate(payload)}
            onCancel={() => router.back()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
