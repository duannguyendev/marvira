'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdvancedFields } from '@/components/ui/advanced-fields';
import { EventCoverImageField } from '@/features/events/event-cover-image-field';
import { EventDifficulty } from '@marvira/shared-types';
import type { Event } from '@marvira/shared-types';
import { newEventSchema, type EventFormValues } from '@/lib/validation/schemas';

function normalizeEventFields(data: EventFormValues): EventFormValues {
  return {
    ...data,
    coverImage: data.coverImage?.trim() || null,
    completionMessage: data.completionMessage?.trim() || null,
    giftTeaser: data.giftTeaser?.trim() || null,
    giftCodes: (data.giftCodes ?? []).map(c => c.trim()).filter(Boolean),
  };
}

export default function NewEventPage() {
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(newEventSchema),
    defaultValues: {
      difficulty: EventDifficulty.MEDIUM,
      rewardPoints: 100,
      isActive: false,
      language: 'vi',
      coverImage: '',
      completionMessage: '',
      giftTeaser: '',
      giftCodes: [],
    },
  });

  const giftCodesText = (watch('giftCodes') ?? []).join('\n');

  const mutation = useMutation({
    mutationFn: (data: EventFormValues) =>
      api.post<Event>('/events', {
        ...normalizeEventFields(data),
        isActive: false,
      }),
    onSuccess: event => {
      toast.success('Event created');
      router.push(`/dashboard/events/${event.id}`);
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Failed to create event'),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Event</h1>
        <p className="text-muted-foreground">
          Set up a new scavenger hunt event
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(d => mutation.mutate(d))}
            className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Downtown Discovery Hunt"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Describe the hunt experience..."
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="San Francisco"
                  {...register('city')}
                />
                {errors.city && (
                  <p className="text-sm text-destructive">
                    {errors.city.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Content language *</Label>
                <select
                  id="language"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register('language')}>
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                </select>
                {errors.language && (
                  <p className="text-sm text-destructive">
                    {errors.language.message}
                  </p>
                )}
              </div>
            </div>

            <EventCoverImageField
              control={control}
              setValue={setValue}
              register={register}
            />

            <AdvancedFields>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <select
                    id="difficulty"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...register('difficulty')}>
                    {Object.values(EventDifficulty).map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rewardPoints">Reward Points</Label>
                  <Input
                    id="rewardPoints"
                    type="number"
                    min={0}
                    max={10000}
                    {...register('rewardPoints')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Event leaderboard only (default 100). Does not raise the
                    global leaderboard.
                  </p>
                  {errors.rewardPoints && (
                    <p className="text-sm text-destructive">
                      {errors.rewardPoints.message}
                    </p>
                  )}
                </div>
              </div>
            </AdvancedFields>

            <AdvancedFields label="Completion gifts (optional)">
              <p className="text-xs text-muted-foreground">
                Soonest finishers receive codes in order (1st → first code). Max
                10.
              </p>
              <div className="space-y-2">
                <Label htmlFor="giftTeaser">Gift teaser</Label>
                <Input
                  id="giftTeaser"
                  placeholder="e.g. Free drink, 10% off"
                  maxLength={80}
                  {...register('giftTeaser')}
                />
                {errors.giftTeaser && (
                  <p className="text-sm text-destructive">
                    {errors.giftTeaser.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="completionMessage">Completion message</Label>
                <textarea
                  id="completionMessage"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Thanks for playing! Show this code at the counter to redeem..."
                  maxLength={2000}
                  {...register('completionMessage')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="giftCodes">Gift codes</Label>
                <textarea
                  id="giftCodes"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  placeholder={'CODE-FIRST\nCODE-SECOND\nCODE-THIRD'}
                  value={giftCodesText}
                  onChange={e =>
                    setValue('giftCodes', e.target.value.split('\n'), {
                      shouldValidate: true,
                    })
                  }
                />
                {errors.giftCodes && (
                  <p className="text-sm text-destructive">
                    {typeof errors.giftCodes.message === 'string'
                      ? errors.giftCodes.message
                      : 'Invalid gift codes'}
                  </p>
                )}
              </div>
            </AdvancedFields>

            <p className="text-xs text-muted-foreground">
              Saved as draft. Add places and questions, then publish from the
              edit page.
            </p>
            <div className="flex gap-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creating...' : 'Create Event'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
