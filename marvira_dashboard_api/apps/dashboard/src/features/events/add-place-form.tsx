'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LocationMapField } from '@/features/events/location-map-field';
import { placeSchema, type PlaceFormValues } from '@/lib/validation/schemas';

interface AddPlaceFormProps {
  eventId: string;
  nextOrderIndex: number;
  defaultLat?: number;
  defaultLng?: number;
  onAdded: () => void;
}

export function AddPlaceForm({
  eventId,
  nextOrderIndex,
  defaultLat = 37.7749,
  defaultLng = -122.4194,
  onAdded,
}: AddPlaceFormProps) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PlaceFormValues>({
    resolver: zodResolver(placeSchema),
    defaultValues: {
      title: '',
      description: '',
      latitude: defaultLat,
      longitude: defaultLng,
      radiusMeters: 100,
      orderIndex: nextOrderIndex,
      hint: '',
    },
  });

  const latitude = watch('latitude');
  const longitude = watch('longitude');
  const radiusMeters = watch('radiusMeters');

  const createMutation = useMutation({
    mutationFn: (data: PlaceFormValues) =>
      api.post('/places', {
        eventId,
        ...data,
        hint: data.hint?.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Place added');
      reset({
        title: '',
        description: '',
        latitude: defaultLat,
        longitude: defaultLng,
        radiusMeters: 100,
        orderIndex: nextOrderIndex + 1,
        hint: '',
      });
      setOpen(false);
      onAdded();
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to add place'),
  });

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Place
      </Button>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-base">New Place</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(data => createMutation.mutate(data))}
          className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input placeholder="e.g. Union Square" {...register('title')} />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Order *</Label>
            <Input type="number" min={0} {...register('orderIndex')} />
            {errors.orderIndex && (
              <p className="text-sm text-destructive">
                {errors.orderIndex.message}
              </p>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Description *</Label>
            <textarea
              className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="What players will see at this stop"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Location on map *</Label>
            <LocationMapField
              latitude={Number(latitude)}
              longitude={Number(longitude)}
              radiusMeters={Number(radiusMeters)}
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
          </div>

          <div className="space-y-2">
            <Label>Latitude *</Label>
            <Input type="number" step="any" {...register('latitude')} />
            {errors.latitude && (
              <p className="text-sm text-destructive">
                {errors.latitude.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Longitude *</Label>
            <Input type="number" step="any" {...register('longitude')} />
            {errors.longitude && (
              <p className="text-sm text-destructive">
                {errors.longitude.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Radius (meters) *</Label>
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
            <Input placeholder="Optional" {...register('hint')} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Create Place'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
