'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useWatch,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';
import { ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SafeImg } from '@/components/safe-img';
import { resolveImageUrl } from '@/lib/resolve-image-url';
import type { EventFormValues } from '@/lib/validation/schemas';

interface EventCoverImageFieldProps {
  control: Control<EventFormValues>;
  setValue: UseFormSetValue<EventFormValues>;
  register: UseFormRegister<EventFormValues>;
}

export function EventCoverImageField({
  control,
  setValue,
  register,
}: EventCoverImageFieldProps) {
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

  const coverImage = useWatch({ control, name: 'coverImage' });
  const previewSrc =
    localPreview || (coverImage?.trim() ? resolveImageUrl(coverImage) : '');

  return (
    <div className="space-y-2">
      <input type="hidden" {...register('coverImage')} />
      <Label>Cover image</Label>
      <div className="flex flex-wrap items-start gap-4">
        {previewSrc ? (
          <SafeImg
            src={previewSrc}
            alt="Cover preview"
            className="h-40 w-auto max-w-full rounded-md border object-contain bg-background"
            placeholderClassName="flex h-40 w-56 items-center justify-center rounded-md border border-dashed bg-background text-sm text-muted-foreground"
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
            {uploading
              ? 'Uploading...'
              : 'Shown on event cards in the app. JPEG, PNG, or WebP up to 5 MB'}
          </p>
        </div>
      </div>
    </div>
  );
}
