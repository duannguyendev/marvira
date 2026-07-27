import {
  ApiCompletedEventProgress,
  ApiEvent,
  ApiPlace,
  ApiQuestionPublic,
} from '../types/api';
import {
  Event,
  EventDetails,
  EventStatus,
  Place,
  PlaceQuestion,
} from '../types';

function placeLocation(place: ApiPlace) {
  return { latitude: place.latitude, longitude: place.longitude };
}

export function mapPlace(apiPlace: ApiPlace): Place {
  return {
    id: apiPlace.id,
    eventId: apiPlace.eventId,
    name: apiPlace.title,
    description: apiPlace.description,
    location: placeLocation(apiPlace),
    order: apiPlace.orderIndex + 1,
    radiusMeters: apiPlace.radiusMeters,
    isUnlocked: apiPlace.unlocked ?? false,
    isAccessible: apiPlace.accessible ?? false,
    isCompleted: apiPlace.completed ?? false,
    hint: apiPlace.hint ?? undefined,
  };
}

export function mapQuestion(apiQuestion: ApiQuestionPublic): PlaceQuestion {
  return {
    id: apiQuestion.id,
    text: apiQuestion.question,
    type: apiQuestion.type,
    imageUrl: apiQuestion.imageUrl ?? undefined,
    options: apiQuestion.options ?? undefined,
    points: apiQuestion.points,
    answerUpdatedAt: apiQuestion.answerUpdatedAt ?? undefined,
  };
}

function eventLocation(apiEvent: ApiEvent) {
  const first = apiEvent.places?.[0];
  if (first) {
    return { latitude: first.latitude, longitude: first.longitude };
  }
  return { latitude: 0, longitude: 0 };
}

function deriveEventStatus(
  places: Place[],
  completedEventIds?: Set<string>,
  eventId?: string,
): EventStatus {
  if (eventId && completedEventIds?.has(eventId)) {
    return 'completed';
  }
  if (places.some(p => p.isCompleted)) {
    const allDone = places.length > 0 && places.every(p => p.isCompleted);
    if (allDone) {
      return 'completed';
    }
    return 'in_progress';
  }
  return 'not_started';
}

export function mapEvent(
  apiEvent: ApiEvent,
  completedEventIds?: Set<string>,
): Event {
  const places = apiEvent.places?.map(mapPlace) ?? [];
  const totalPlaces =
    apiEvent._count?.places ?? apiEvent.places?.length ?? places.length;
  const completedPlaces = places.filter(p => p.isCompleted).length;
  const scheduledPublishAt = apiEvent.scheduledPublishAt ?? null;
  const isActive = apiEvent.isActive;
  const isIncoming =
    !isActive &&
    !!scheduledPublishAt &&
    new Date(scheduledPublishAt).getTime() > Date.now();

  return {
    id: apiEvent.id,
    title: apiEvent.title,
    description: apiEvent.description,
    city: apiEvent.city,
    imageUrl: apiEvent.coverImage ?? undefined,
    startDate: apiEvent.createdAt,
    endDate: apiEvent.updatedAt,
    status: deriveEventStatus(places, completedEventIds, apiEvent.id),
    totalPlaces,
    completedPlaces,
    distance: apiEvent.distanceMeters,
    location: eventLocation(apiEvent),
    rewardPoints: apiEvent.rewardPoints,
    isPasswordProtected: apiEvent.isPasswordProtected ?? false,
    hasAccess: apiEvent.hasAccess,
    hasGift: apiEvent.hasGift ?? (apiEvent.giftCodes?.length ?? 0) > 0,
    giftCount: apiEvent.giftCount ?? apiEvent.giftCodes?.length ?? 0,
    giftTeaser: apiEvent.giftTeaser ?? null,
    giftCodes: apiEvent.giftCodes,
    completionMessage: apiEvent.completionMessage ?? null,
    language: apiEvent.language,
    isActive,
    scheduledPublishAt,
    isIncoming,
  };
}

export function mapEventDetails(
  apiEvent: ApiEvent,
  apiPlaces: ApiPlace[],
  completedEventIds?: Set<string>,
): EventDetails {
  const places = apiPlaces.map(mapPlace);
  const completedPlaces = places.filter(p => p.isCompleted).length;
  const totalPlaces = apiEvent._count?.places ?? places.length;
  const progress =
    totalPlaces > 0 ? Math.round((completedPlaces / totalPlaces) * 100) : 0;

  const base = mapEvent(
    { ...apiEvent, places: apiPlaces, _count: { places: totalPlaces } },
    completedEventIds,
  );

  return {
    ...base,
    places,
    completedPlaces,
    totalPlaces,
    progress,
  };
}

export function mapCompletedProgress(row: ApiCompletedEventProgress): Event {
  const placesCount = row.event._count?.places ?? 0;
  return {
    id: row.event.id,
    title: row.event.title,
    description: row.event.description,
    city: row.event.city,
    imageUrl: row.event.coverImage ?? undefined,
    startDate: row.event.createdAt,
    endDate: row.completedAt ?? row.event.updatedAt,
    status: 'completed',
    totalPlaces: placesCount,
    completedPlaces: placesCount,
    location: { latitude: 0, longitude: 0 },
    rewardPoints: row.event.rewardPoints,
    score: row.score,
    totalDurationMs: row.totalDurationMs,
  };
}
