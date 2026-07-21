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
import { EventDifficulty } from '@marvira/shared-types';
import type { Event } from '@marvira/shared-types';
import { newEventSchema, type EventFormValues } from '@/lib/validation/schemas';

export default function NewEventPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(newEventSchema),
    defaultValues: {
      difficulty: EventDifficulty.MEDIUM,
      rewardPoints: 100,
      isActive: false,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: EventFormValues) => api.post<Event>('/events', data),
    onSuccess: (event) => {
      toast.success('Event created');
      router.push(`/dashboard/events/${event.id}`);
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create event'),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Event</h1>
        <p className="text-muted-foreground">Set up a new scavenger hunt event</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" placeholder="Downtown Discovery Hunt" {...register('title')} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
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
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input id="city" placeholder="San Francisco" {...register('city')} />
                {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty *</Label>
                <select
                  id="difficulty"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register('difficulty')}
                >
                  {Object.values(EventDifficulty).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {errors.difficulty && (
                  <p className="text-sm text-destructive">{errors.difficulty.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rewardPoints">Reward Points *</Label>
              <Input id="rewardPoints" type="number" min={0} {...register('rewardPoints')} />
              {errors.rewardPoints && (
                <p className="text-sm text-destructive">{errors.rewardPoints.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" {...register('isActive')} className="h-4 w-4" />
                <Label htmlFor="isActive">Publish immediately</Label>
              </div>
              {errors.isActive && (
                <p className="text-sm text-destructive">{errors.isActive.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Recommended: save as draft, add places and questions, then publish from the edit page.
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creating...' : 'Create Event'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
