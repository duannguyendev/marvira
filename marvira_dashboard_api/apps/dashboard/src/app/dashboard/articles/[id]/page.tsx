'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArticleForm } from '@/features/articles/article-form';
import type { Article, CreateArticleDto } from '@marvira/shared-types';

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: article, isLoading } = useQuery({
    queryKey: ['admin-article', id],
    queryFn: () => api.get<Article>(`/admin/articles/${id}`),
  });

  const mutation = useMutation({
    mutationFn: (payload: CreateArticleDto) => api.patch<Article>(`/admin/articles/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-article', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      toast.success('Article saved');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to save article'),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!article) {
    return <p>Article not found</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Article</h1>
          <p className="text-muted-foreground">{article.title}</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/articles')}>
          Back to Articles
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Article Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ArticleForm
            article={article}
            submitLabel="Save Article"
            submitting={mutation.isPending}
            onSubmit={(payload) => mutation.mutate(payload)}
            onCancel={() => router.push('/dashboard/articles')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
