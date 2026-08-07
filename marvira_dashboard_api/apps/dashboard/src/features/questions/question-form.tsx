'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, ImageIcon } from 'lucide-react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdvancedFields } from '@/components/ui/advanced-fields';
import { QuestionType, type AdminQuestion } from '@marvira/shared-types';
import {
  questionSchema,
  type QuestionFormValues,
} from '@/lib/validation/schemas';
import { resolveImageUrl } from '@/lib/resolve-image-url';

export { resolveImageUrl };

const LANGUAGE_OPTIONS = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
] as const;

function parseOptions(options: AdminQuestion['options']): string[] {
  if (!options) return ['', ''];
  if (Array.isArray(options)) return options.map(String);
  return ['', ''];
}

interface QuestionFormProps {
  question?: AdminQuestion | null;
  onSaved: (question: AdminQuestion) => void;
  onCancel?: () => void;
  showSuccessToast?: boolean;
  apiBasePath?: string;
}

export function QuestionForm({
  question,
  onSaved,
  onCancel,
  showSuccessToast = true,
  apiBasePath = '/questions',
}: QuestionFormProps) {
  const isEditing = Boolean(question);
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
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question: '',
      type: QuestionType.TEXT,
      imageUrl: '',
      answer: '',
      explanation: '',
      points: 10,
      language: 'vi',
      options: [{ value: '' }, { value: '' }],
    },
  });

  const questionType = useWatch({ control, name: 'type' });
  const imageUrl = useWatch({ control, name: 'imageUrl' });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  });

  const previewSrc =
    localPreview || (imageUrl?.trim() ? resolveImageUrl(imageUrl) : '');

  useEffect(() => {
    if (!question) return;
    revokeLocalPreview();
    reset({
      question: question.question,
      type: question.type as QuestionType,
      imageUrl: question.imageUrl ?? '',
      answer: question.answer,
      explanation: question.explanation ?? '',
      points: question.points,
      language: (question.language as QuestionFormValues['language']) ?? 'vi',
      options:
        question.type === QuestionType.MULTIPLE_CHOICE
          ? parseOptions(question.options).map(value => ({ value }))
          : question.type === QuestionType.TRUE_FALSE
            ? [{ value: 'True' }, { value: 'False' }]
            : undefined,
    });
  }, [
    question?.id,
    question?.question,
    question?.type,
    question?.imageUrl,
    question?.answer,
    question?.explanation,
    question?.points,
    question?.language,
    JSON.stringify(question?.options ?? null),
    reset,
    revokeLocalPreview,
    question,
  ]);

  useEffect(() => {
    if (questionType === QuestionType.TRUE_FALSE) {
      setValue('options', [{ value: 'True' }, { value: 'False' }]);
    }
    if (
      questionType === QuestionType.TEXT ||
      questionType === QuestionType.IMAGE
    ) {
      setValue('options', undefined);
    }
    if (questionType === QuestionType.MULTIPLE_CHOICE && fields.length < 2) {
      setValue('options', [{ value: '' }, { value: '' }]);
    }
  }, [questionType, setValue, fields.length]);

  const saveMutation = useMutation({
    mutationFn: (values: QuestionFormValues) => {
      const payload = {
        question: values.question,
        type: values.type,
        imageUrl:
          values.type === QuestionType.IMAGE
            ? values.imageUrl?.trim()
            : undefined,
        answer: values.answer.trim(),
        explanation: values.explanation?.trim() || undefined,
        points: values.points,
        language: values.language,
        options:
          values.type === QuestionType.MULTIPLE_CHOICE
            ? values.options?.map(o => o.value.trim()).filter(Boolean)
            : values.type === QuestionType.TRUE_FALSE
              ? ['True', 'False']
              : undefined,
      };

      if (isEditing && question) {
        return api.patch<AdminQuestion>(
          `${apiBasePath}/${question.id}`,
          payload,
        );
      }
      return api.post<AdminQuestion>(apiBasePath, payload);
    },
    onSuccess: data => {
      if (showSuccessToast) {
        toast.success(isEditing ? 'Question updated' : 'Question created');
      }
      onSaved(data);
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Failed to save question'),
  });

  return (
    <form
      onSubmit={handleSubmit(values => saveMutation.mutate(values))}
      className="space-y-4">
      <input type="hidden" {...register('imageUrl')} />

      <div className="space-y-2">
        <Label>
          {questionType === QuestionType.IMAGE ? 'Caption' : 'Question'}
        </Label>
        <textarea
          className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder={
            questionType === QuestionType.IMAGE
              ? 'e.g. What landmark is shown in this image?'
              : 'What do players need to answer?'
          }
          {...register('question')}
        />
        {errors.question && (
          <p className="text-sm text-destructive">{errors.question.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...register('type')}>
          {Object.values(QuestionType).map(t => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Correct Answer</Label>
        {questionType === QuestionType.TRUE_FALSE ? (
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register('answer')}>
            <option value="True">True</option>
            <option value="False">False</option>
            </select>
          ) : questionType === QuestionType.MULTIPLE_CHOICE ? (
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('answer')}>
              <option value="">Select correct option</option>
              {fields.map((field, i) => (
                <option
                  key={field.id}
                  value={watch(`options.${i}.value`) || ''}>
                  {watch(`options.${i}.value`) || `Option ${i + 1}`}
                </option>
              ))}
            </select>
          ) : (
            <Input placeholder="Correct answer" {...register('answer')} />
          )}
          {errors.answer && (
            <p className="text-sm text-destructive">{errors.answer.message}</p>
          )}
        </div>

      {questionType === QuestionType.IMAGE && (
        <div className="space-y-2">
          <Label>Question Image</Label>
          <div className="flex flex-wrap items-start gap-4">
            {previewSrc ? (
              <img
                src={previewSrc}
                alt="Question preview"
                className="h-40 w-auto max-w-full rounded-md border object-contain bg-background"
              />
            ) : (
              <div className="flex h-40 w-56 items-center justify-center rounded-md border border-dashed bg-background text-muted-foreground text-sm">
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
                    setValue('imageUrl', result.url, {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true,
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
              {(previewSrc || imageUrl) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setValue('imageUrl', '', {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true,
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
          {errors.imageUrl && (
            <p className="text-sm text-destructive">
              {errors.imageUrl.message}
            </p>
          )}
        </div>
      )}

      {questionType === QuestionType.MULTIPLE_CHOICE && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Options</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ value: '' })}>
              <Plus className="h-3 w-3" />
              Add option
            </Button>
          </div>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  {...register(`options.${index}.value` as const)}
                />
                {fields.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {errors.options && (
            <p className="text-sm text-destructive">{errors.options.message}</p>
          )}
        </div>
      )}

      <AdvancedFields
        defaultOpen={
          Boolean(question?.explanation?.trim()) ||
          (question != null && question.points !== 10)
        }>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Points</Label>
            <Input type="number" min={1} {...register('points')} />
            {errors.points && (
              <p className="text-sm text-destructive">{errors.points.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Content language</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('language')}>
              {LANGUAGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Explanation (shown after correct answer)</Label>
          <Input
            placeholder="Optional explanation"
            {...register('explanation')}
          />
        </div>
      </AdvancedFields>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending
            ? 'Saving...'
            : isEditing
              ? 'Update Question'
              : 'Create Question'}
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
