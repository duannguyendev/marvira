import { AxiosError } from 'axios';
import {
  ApiEvent,
  ApiPaginated,
  ApiPlace,
  ApiQuestionPublic,
  QuestionType,
} from '../types/api';
import {
  ApiResponse,
  CreateEventInput,
  CreatePlaceInput,
  CreateQuestionInput,
  MyCreatedEvent,
  PublishEventInput,
  SchedulePublishInput,
} from '../types';
import { apiClient } from './client';
import { mapEvent } from './mappers';

function mapMyCreatedEvent(apiEvent: ApiEvent): MyCreatedEvent {
  const base = mapEvent(apiEvent);
  const firstPlace = apiEvent.places?.[0];
  const endedAt = apiEvent.endedAt ?? null;
  const scheduledPublishAt = apiEvent.scheduledPublishAt ?? null;
  const isPublished = apiEvent.isActive && !endedAt;
  const lifecycleStatus: MyCreatedEvent['lifecycleStatus'] = endedAt
    ? 'done'
    : isPublished
      ? 'published'
      : scheduledPublishAt
        ? 'scheduled'
        : 'draft';
  return {
    ...base,
    isPublished,
    scheduledPublishAt,
    endsAt: apiEvent.endsAt ?? null,
    endedAt,
    lifecycleStatus,
    difficulty:
      (apiEvent.difficulty as MyCreatedEvent['difficulty']) ?? 'MEDIUM',
    location: firstPlace
      ? { latitude: firstPlace.latitude, longitude: firstPlace.longitude }
      : base.location,
    totalPlaces: apiEvent._count?.places ?? base.totalPlaces,
  };
}

export const eventCreationApi = {
  getMyEvents: async (): Promise<ApiResponse<MyCreatedEvent[]>> => {
    const response = await apiClient.get<{
      success: boolean;
      data: ApiPaginated<ApiEvent>;
    }>('/events/mine', { params: { page: 1, pageSize: 50 } });

    return {
      success: true,
      data: response.data.data.items.map(mapMyCreatedEvent),
    };
  },

  createEvent: async (
    input: CreateEventInput,
  ): Promise<ApiResponse<ApiEvent>> => {
    const response = await apiClient.post<{ success: boolean; data: ApiEvent }>(
      '/events',
      { ...input, isActive: false },
    );
    return { success: true, data: response.data.data };
  },

  createQuestion: async (
    input: CreateQuestionInput,
  ): Promise<ApiQuestionPublic> => {
    const response = await apiClient.post<{
      success: boolean;
      data: ApiQuestionPublic & { answer: string };
    }>('/questions', {
      question: input.question,
      type: input.type,
      answer: input.answer,
      options: input.options,
      points: input.points ?? 10,
      imageUrl: input.imageUrl,
      language: input.language,
    });
    return response.data.data;
  },

  linkQuestionToEvent: async (
    eventId: string,
    questionId: string,
    orderIndex: number,
  ): Promise<void> => {
    try {
      await apiClient.post(`/events/${eventId}/questions`, {
        questionId,
        orderIndex,
      });
    } catch (error) {
      const status = (error as AxiosError)?.response?.status;
      if (status !== 409) {
        throw error;
      }
    }
  },

  createPlace: async (
    eventId: string,
    orderIndex: number,
    input: CreatePlaceInput,
    questionId: string,
  ): Promise<ApiPlace> => {
    const response = await apiClient.post<{ success: boolean; data: ApiPlace }>(
      '/places',
      {
        eventId,
        title: input.title,
        description: input.description,
        latitude: input.latitude,
        longitude: input.longitude,
        radiusMeters: input.radiusMeters,
        orderIndex,
        hint: input.hint,
        questionId,
      },
    );
    return response.data.data;
  },

  createPlaceWithQuestion: async (
    eventId: string,
    orderIndex: number,
    placeInput: CreatePlaceInput,
    questionInput: CreateQuestionInput,
  ): Promise<ApiPlace> => {
    const question = await eventCreationApi.createQuestion(questionInput);
    await eventCreationApi.linkQuestionToEvent(
      eventId,
      question.id,
      orderIndex,
    );
    return eventCreationApi.createPlace(
      eventId,
      orderIndex,
      placeInput,
      question.id,
    );
  },

  publishEvent: async (
    eventId: string,
    input?: PublishEventInput,
  ): Promise<ApiEvent> => {
    const response = await apiClient.patch<{
      success: boolean;
      data: ApiEvent;
    }>(`/events/${eventId}`, { isActive: true, ...input });
    return response.data.data;
  },

  schedulePublish: async (
    eventId: string,
    input: SchedulePublishInput,
  ): Promise<{ id: string; scheduledPublishAt: string | null }> => {
    const { scheduledPublishAt, ...rest } = input;
    if (Object.keys(rest).length > 0) {
      await apiClient.patch(`/events/${eventId}`, rest);
    }
    const response = await apiClient.post<{
      success: boolean;
      data: { id: string; scheduledPublishAt: string | null };
    }>(`/events/${eventId}/schedule`, { scheduledPublishAt });
    return response.data.data;
  },

  cancelSchedule: async (
    eventId: string,
  ): Promise<{ id: string; scheduledPublishAt: string | null }> => {
    const response = await apiClient.delete<{
      success: boolean;
      data: { id: string; scheduledPublishAt: string | null };
    }>(`/events/${eventId}/schedule`);
    return response.data.data;
  },

  deleteEvent: async (eventId: string): Promise<void> => {
    await apiClient.delete(`/events/${eventId}`);
  },

  endEvent: async (
    eventId: string,
  ): Promise<{
    id: string;
    endsAt: string | null;
    endedAt: string | null;
  }> => {
    const response = await apiClient.post<{
      success: boolean;
      data: {
        id: string;
        endsAt: string | null;
        endedAt: string | null;
      };
    }>(`/events/${eventId}/end`);
    return response.data.data;
  },

  updateEventGifts: async (
    eventId: string,
    input: {
      completionMessage?: string | null;
      giftTeaser?: string | null;
      giftCodes?: string[];
    },
  ): Promise<ApiEvent> => {
    const response = await apiClient.patch<{
      success: boolean;
      data: ApiEvent;
    }>(`/events/${eventId}`, input);
    return response.data.data;
  },
};

export type { QuestionType };
