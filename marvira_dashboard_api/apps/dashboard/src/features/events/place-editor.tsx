'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdvancedFields } from '@/components/ui/advanced-fields';
import { PlaceQuestionEditor } from '@/features/questions/place-question-editor';
import { LocationMapField } from '@/features/events/location-map-field';
import { placeSchema, type PlaceFormValues } from '@/lib/validation/schemas';
import type { PlaceWithQuestion } from '@marvira/shared-types';

interface PlaceEditorProps {
  eventId: string;
  place: PlaceWithQuestion;
  stopNumber: number;
  onUpdated: () => void;
  onDelete: () => void;
}

function hasNonDefaultAdvanced(place: PlaceWithQuestion): boolean {
  return (
    Boolean(place.description?.trim()) ||
    place.radiusMeters !== 100 ||
    Boolean(place.hint?.trim())
  );
}

export function PlaceEditor({
  eventId,
  place,
  stopNumber,
  onUpdated,
  onDelete,
}: PlaceEditorProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<PlaceFormValues>({
    resolver: zodResolver(placeSchema),
    defaultValues: {
      title: place.title,
      description: place.description,
      latitude: place.latitude,
      longitude: place.longitude,
      radiusMeters: place.radiusMeters,
      orderIndex: place.orderIndex,
      hint: place.hint ?? '',
    },
  });

  const latitude = watch('latitude');
  const longitude = watch('longitude');
  const radiusMeters = watch('radiusMeters');

  useEffect(() => {
    reset({
      title: place.title,
      description: place.description,
      latitude: place.latitude,
      longitude: place.longitude,
      radiusMeters: place.radiusMeters,
      orderIndex: place.orderIndex,
      hint: place.hint ?? '',
    });
  }, [place, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: PlaceFormValues) =>
      api.patch(`/places/${place.id}`, {
        title: data.title,
        description: data.description?.trim() || '',
        latitude: data.latitude,
        longitude: data.longitude,
        radiusMeters: data.radiusMeters ?? 100,
        orderIndex: place.orderIndex,
        hint: data.hint?.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Place saved');
      onUpdated();
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to save place'),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">
          Stop #{stopNumber} — {place.title}
        </CardTitle>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onDelete}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(data => saveMutation.mutate(data))}
          className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Title *</Label>
            <Input {...register('title')} />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Location on map *</Label>
            <LocationMapField
              latitude={Number(latitude)}
              longitude={Number(longitude)}
              radiusMeters={Number(radiusMeters) || 100}
              onChange={(lat, lng) => {
                setValue('latitude', lat, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setValue('longitude', lng, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            />
            {(errors.latitude || errors.longitude) && (
              <p className="text-sm text-destructive">
                {errors.latitude?.message || errors.longitude?.message}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <AdvancedFields defaultOpen={hasNonDefaultAdvanced(place)}>
              <div className="space-y-2">
                <Label>Description</Label>
                <textarea
                  className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Optional — what players see at this stop"
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
                  <Label>Radius (meters)</Label>
                  <Input
                    type="number"
                    min={10}
                    max={5000}
                    {...register('radiusMeters')}
                  />
                  {errors.radiusMeters && (
                    <p className="text-sm text-destructive">
                      {errors.radiusMeters.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Hint</Label>
                  <Input
                    placeholder="Optional hint for players"
                    {...register('hint')}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input type="number" step="any" {...register('latitude')} />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input type="number" step="any" {...register('longitude')} />
                </div>
              </div>
            </AdvancedFields>
          </div>

          <div className="sm:col-span-2">
            <Button
              type="submit"
              disabled={saveMutation.isPending || !isDirty}
              size="sm">
              {saveMutation.isPending ? 'Saving...' : 'Save Place'}
            </Button>
          </div>

          <PlaceQuestionEditor
            eventId={eventId}
            place={place}
            onUpdated={onUpdated}
          />
        </form>
      </CardContent>
    </Card>
  );
}
