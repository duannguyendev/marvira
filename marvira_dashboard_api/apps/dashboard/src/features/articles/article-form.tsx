'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resolveImageUrl } from '@/lib/resolve-image-url';
import {
  articleSchema,
  type ArticleFormValues,
} from '@/lib/validation/schemas';
import {
  ArticleStatus,
  type Article,
  type Event,
  type PaginatedResponse,
  type CreateArticleDto,
} from '@marvira/shared-types';

interface ArticleFormProps {
  article?: Article | null;
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (payload: CreateArticleDto) => void;
  onCancel?: () => void;
}

export function ArticleForm({
  article,
  submitting = false,
  submitLabel,
  onSubmit,
  onCancel,
}: ArticleFormProps) {
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const localPreviewRef = useRef<string | null>(null);

  const revokeLocalPreview = useCallback(() => {
    if (localPreviewRef.current) {
      URL.revokeObjectURL(localPreviewRef.current);
      localPreviewRef.current = null;
    }
    setLocalPreview(null);
  }, []);

  useEffect(() => () => revokeLocalPreview(), [revokeLocalPreview]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      slug: '',
      placeName: '',
      city: '',
      excerpt: '',
      body: '',
      coverImage: '',
      status: ArticleStatus.DRAFT,
      eventId: '',
    },
  });

  useEffect(() => {
    if (!article) return;
    revokeLocalPreview();
    reset({
      title: article.title,
      slug: article.slug,
      placeName: article.placeName,
      city: article.city ?? '',
      excerpt: article.excerpt,
      body: article.body,
      coverImage: article.coverImage ?? '',
      status: article.status,
      eventId: article.eventId ?? '',
    });
  }, [article, reset, revokeLocalPreview]);

  const { data: eventsData } = useQuery({
    queryKey: ['admin-events-picker'],
    queryFn: () =>
      api.get<PaginatedResponse<Event>>('/admin/events?pageSize=100'),
  });

  const coverImage = useWatch({ control, name: 'coverImage' });
  const previewSrc =
    localPreview || (coverImage?.trim() ? resolveImageUrl(coverImage) : '');

  const submit = (values: ArticleFormValues) => {
    const payload: CreateArticleDto = {
      title: values.title.trim(),
      slug: values.slug?.trim() || undefined,
      placeName: values.placeName.trim(),
      city: values.city?.trim() || undefined,
      excerpt: values.excerpt.trim(),
      body: values.body,
      coverImage: values.coverImage?.trim() || undefined,
      status: values.status,
      eventId: values.eventId?.trim() || null,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <input type="hidden" {...register('coverImage')} />

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="Explore Downtown San Francisco"
          {...register('title')}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="placeName">Place name *</Label>
          <Input
            id="placeName"
            placeholder="Union Square"
            {...register('placeName')}
          />
          {errors.placeName && (
            <p className="text-sm text-destructive">
              {errors.placeName.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" placeholder="San Francisco" {...register('city')} />
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          placeholder="explore-downtown-san-francisco"
          {...register('slug')}
        />
        <p className="text-xs text-muted-foreground">
          Used in the shareable URL (/explore/&lt;slug&gt;). Leave blank to
          auto-generate from the title.
        </p>
        {errors.slug && (
          <p className="text-sm text-destructive">{errors.slug.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt *</Label>
        <textarea
          id="excerpt"
          className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Short teaser shown on cards and social previews (max 300 characters)."
          {...register('excerpt')}
        />
        {errors.excerpt && (
          <p className="text-sm text-destructive">{errors.excerpt.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Body (Markdown) *</Label>
        <textarea
          id="body"
          className="flex min-h-[220px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
          placeholder={
            '## Heading\n\nWrite the full article here. Markdown is supported.'
          }
          {...register('body')}
        />
        {errors.body && (
          <p className="text-sm text-destructive">{errors.body.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Cover image</Label>
        <div className="flex flex-wrap items-start gap-4">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt="Cover preview"
              className="h-40 w-auto max-w-full rounded-md border object-contain bg-background"
            />
          ) : (
            <div className="flex h-40 w-56 items-center justify-center rounded-md border border-dashed bg-background text-sm text-muted-foreground">
              <ImageIcon className="mr-2 h-4 w-4" />
              No image selected
            </div>
          )}
          <div className="space-y-2">
            <Input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                revokeLocalPreview();
                const objectUrl = URL.createObjectURL(file);
                localPreviewRef.current = objectUrl;
                setLocalPreview(objectUrl);
                setUploading(true);
                try {
                  const result = await api.upload(file);
                  setValue('coverImage', result.url, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  revokeLocalPreview();
                  toast.success('Image uploaded');
                } catch {
                  revokeLocalPreview();
                  toast.error('Image upload failed');
                } finally {
                  setUploading(false);
                  e.target.value = '';
                }
              }}
            />
            {(previewSrc || coverImage) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setValue('coverImage', '', {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  revokeLocalPreview();
                }}>
                Remove image
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              {uploading ? 'Uploading...' : 'JPEG, PNG, or WebP up to 5 MB'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <select
            id="status"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register('status')}>
            {Object.values(ArticleStatus).map(s => (
              <option key={s} value={s}>
                {s === ArticleStatus.PUBLISHED
                  ? 'Published (visible on Explore page)'
                  : 'Draft'}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="eventId">Linked event (optional)</Label>
          <select
            id="eventId"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register('eventId')}>
            <option value="">None — standalone article</option>
            {eventsData?.items.map(event => (
              <option key={event.id} value={event.id}>
                {event.title}
                {event.city ? ` — ${event.city}` : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Attach a gameplay event to show a &ldquo;Play&rdquo; call-to-action
            on the article.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting || uploading}>
          {submitting ? 'Saving...' : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
