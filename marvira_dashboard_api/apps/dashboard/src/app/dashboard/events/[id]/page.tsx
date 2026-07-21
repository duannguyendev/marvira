'use client';

import { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPicker } from '@/features/events/map-picker';
import { PlaceEditor } from '@/features/events/place-editor';
import { AddPlaceForm } from '@/features/events/add-place-form';
import { EventDifficulty, type AdminEvent } from '@marvira/shared-types';
import { createEditEventSchema, eventSchema, type EventFormValues } from '@/lib/validation/schemas';

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ['admin-event', id],
    queryFn: () => api.get<AdminEvent>(`/admin/events/${id}`),
  });

  const places = useMemo(
    () => [...(event?.places ?? [])].sort((a, b) => a.orderIndex - b.orderIndex),
    [event?.places],
  );

  const placesWithoutQuestion = places.filter((p) => !p.question).length;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      city: '',
      difficulty: EventDifficulty.MEDIUM,
      rewardPoints: 0,
      isActive: false,
    },
  });

  useEffect(() => {
    if (!event) return;
    reset({
      title: event.title,
      description: event.description,
      city: event.city,
      difficulty: event.difficulty as EventDifficulty,
      rewardPoints: event.rewardPoints,
      isActive: event.isActive,
    });
  }, [event, reset]);

  const invalidateEvent = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-event', id] });
    queryClient.invalidateQueries({ queryKey: ['admin-events'] });
    queryClient.invalidateQueries({ queryKey: ['admin-questions-picker'] });
  };

  const updateMutation = useMutation({
    mutationFn: (data: EventFormValues) => api.patch(`/events/${id}`, data),
    onSuccess: () => {
      invalidateEvent();
      toast.success('Event saved');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to save event'),
  });

  const deletePlaceMutation = useMutation({
    mutationFn: (placeId: string) => api.delete(`/places/${placeId}`),
    onSuccess: () => {
      invalidateEvent();
      toast.success('Place deleted');
    },
  });

  const updatePlaceMutation = useMutation({
    mutationFn: ({ placeId, lat, lng }: { placeId: string; lat: number; lng: number }) =>
      api.patch(`/places/${placeId}`, { latitude: lat, longitude: lng }),
    onSuccess: invalidateEvent,
    onError: (err: Error) => toast.error(err.message || 'Invalid coordinates'),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!event) {
    return <p>Event not found</p>;
  }

  const mapCenter = places[0]
    ? { lat: places[0].latitude, lng: places[0].longitude }
    : { lat: 37.7749, lng: -122.4194 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
          <p className="text-muted-foreground">{event.title}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Configure the full hunt trail — all places and questions are visible here. Sequential unlock
            applies only in the mobile app.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/events')}>
          Back to Events
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((d) => {
              const publishSchema = createEditEventSchema({
                placeCount: places.length,
                placesWithoutQuestion,
              });
              const result = publishSchema.safeParse(d);
              if (!result.success) {
                for (const issue of result.error.issues) {
                  const field = issue.path[0];
                  if (typeof field === 'string') {
                    setError(field as keyof EventFormValues, { message: issue.message });
                  }
                }
                toast.error(result.error.issues[0]?.message ?? 'Please fix validation errors');
                return;
              }
              updateMutation.mutate(result.data);
            })}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input {...register('title')} />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>City *</Label>
                <Input {...register('city')} />
                {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Difficulty *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register('difficulty')}
                >
                  {Object.values(EventDifficulty).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Reward Points *</Label>
                <Input type="number" min={0} {...register('rewardPoints')} />
                {errors.rewardPoints && (
                  <p className="text-sm text-destructive">{errors.rewardPoints.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex h-10 items-center gap-2">
                  <input type="checkbox" id="isActive" {...register('isActive')} className="h-4 w-4" />
                  <Label htmlFor="isActive">Published</Label>
                </div>
                {errors.isActive && (
                  <p className="text-sm text-destructive">{errors.isActive.message}</p>
                )}
              </div>
            </div>
            <Button type="submit" disabled={updateMutation.isPending}>
              Save Event
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Places &amp; Questions ({places.length})</h2>
          <p className="text-sm text-muted-foreground">
            Ordered stops — place #1 is the first stop in the mobile hunt. Each place needs a question
            before publishing.
          </p>
        </div>
        <AddPlaceForm
          eventId={id}
          nextOrderIndex={places.length}
          defaultLat={mapCenter.lat}
          defaultLng={mapCenter.lng}
          onAdded={invalidateEvent}
        />
      </div>

      {places.length > 0 && (
        <MapPicker
          places={places}
          onPlaceMove={(placeId, lat, lng) =>
            updatePlaceMutation.mutate({ placeId, lat, lng })
          }
        />
      )}

      <div className="space-y-4">
        {places.map((place, index) => (
          <PlaceEditor
            key={place.id}
            eventId={id}
            place={place}
            stopNumber={index + 1}
            onUpdated={invalidateEvent}
            onDelete={() => {
              if (confirm('Delete this place?')) deletePlaceMutation.mutate(place.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}
