import {apiClient} from './client';
import {USE_MOCK_DATA} from '../utils/constants';

const USE_PRACTICE_MOCK = USE_MOCK_DATA;
import {practiceStorage} from '../services/practiceStorage';
import {practiceMockStore} from './practiceMockStore';
import {eventsApi} from './events';
import {
  ApiResponse,
  Event,
  PracticeQuestionListItem,
} from '../types';
import {ApiEvent} from '../types/api';
import {mapEvent} from './mappers';
import {profileApi} from './profile';

async function getCompletedEventIds(): Promise<Set<string>> {
  try {
    const res = await profileApi.getCompletedEvents();
    return new Set(res.data.map(e => e.id));
  } catch {
    return new Set();
  }
}

export const favoritesApi = {
  isEventFavorite: async (eventId: string): Promise<boolean> => {
    if (USE_PRACTICE_MOCK) {
      const ids = await practiceStorage.getFavoriteEventIds();
      return ids.has(eventId);
    }
    const response = await favoritesApi.getFavoriteEvents();
    return response.data.some(e => e.id === eventId);
  },

  isQuestionFavorite: async (questionId: string): Promise<boolean> => {
    if (USE_PRACTICE_MOCK) {
      const ids = await practiceStorage.getFavoriteQuestionIds();
      return ids.has(questionId);
    }
    const response = await favoritesApi.getFavoriteQuestions();
    return response.data.some(q => q.id === questionId);
  },

  getFavoriteEvents: async (): Promise<ApiResponse<Event[]>> => {
    if (USE_PRACTICE_MOCK) {
      const favoriteIds = await practiceStorage.getFavoriteEventIds();
      const eventsResponse = await eventsApi.getEvents();
      const events = eventsResponse.data.filter(e => favoriteIds.has(e.id));
      return {success: true, data: events};
    }

    const response = await apiClient.get<{success: boolean; data: ApiEvent[]}>(
      '/favorites/events',
    );
    const completedIds = await getCompletedEventIds();
    const events = response.data.data.map(e => mapEvent(e, completedIds));
    return {success: true, data: events};
  },

  getFavoriteQuestions: async (): Promise<
    ApiResponse<PracticeQuestionListItem[]>
  > => {
    if (USE_PRACTICE_MOCK) {
      const [favoriteIds, allQuestions, completedIds] = await Promise.all([
        practiceStorage.getFavoriteQuestionIds(),
        practiceMockStore.getQuestions(),
        practiceStorage.getTrainingCompletedIds(),
      ]);

      const items = allQuestions
        .filter(q => favoriteIds.has(q.id) && q.isPublished)
        .map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          imageUrl: q.imageUrl,
          options: q.options,
          points: q.points,
          authorId: q.authorId,
          authorName: q.authorName,
          source: q.source,
          eventId: q.eventId,
          eventTitle: q.eventTitle,
          isPublished: q.isPublished,
          createdAt: q.createdAt,
          isFavorite: true,
          isTrainingCompleted: completedIds.has(q.id),
        }))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

      return {success: true, data: items};
    }

    const response = await apiClient.get<{
      success: boolean;
      data: PracticeQuestionListItem[];
    }>('/favorites/questions');

    return {success: true, data: response.data.data};
  },

  addFavoriteEvent: async (eventId: string): Promise<ApiResponse<null>> => {
    if (USE_PRACTICE_MOCK) {
      const ids = await practiceStorage.getFavoriteEventIds();
      ids.add(eventId);
      await practiceStorage.setFavoriteEventIds(ids);
      return {success: true, data: null};
    }

    await apiClient.post(`/favorites/events/${eventId}`);
    return {success: true, data: null};
  },

  removeFavoriteEvent: async (eventId: string): Promise<ApiResponse<null>> => {
    if (USE_PRACTICE_MOCK) {
      const ids = await practiceStorage.getFavoriteEventIds();
      ids.delete(eventId);
      await practiceStorage.setFavoriteEventIds(ids);
      return {success: true, data: null};
    }

    await apiClient.delete(`/favorites/events/${eventId}`);
    return {success: true, data: null};
  },

  addFavoriteQuestion: async (
    questionId: string,
  ): Promise<ApiResponse<null>> => {
    if (USE_PRACTICE_MOCK) {
      const ids = await practiceStorage.getFavoriteQuestionIds();
      ids.add(questionId);
      await practiceStorage.setFavoriteQuestionIds(ids);
      return {success: true, data: null};
    }

    await apiClient.post(`/favorites/questions/${questionId}`);
    return {success: true, data: null};
  },

  removeFavoriteQuestion: async (
    questionId: string,
  ): Promise<ApiResponse<null>> => {
    if (USE_PRACTICE_MOCK) {
      const ids = await practiceStorage.getFavoriteQuestionIds();
      ids.delete(questionId);
      await practiceStorage.setFavoriteQuestionIds(ids);
      return {success: true, data: null};
    }

    await apiClient.delete(`/favorites/questions/${questionId}`);
    return {success: true, data: null};
  },
};

export async function toggleEventFavorite(
  eventId: string,
  isFavorite: boolean,
): Promise<void> {
  if (isFavorite) {
    await favoritesApi.removeFavoriteEvent(eventId);
  } else {
    await favoritesApi.addFavoriteEvent(eventId);
  }
}

export async function toggleQuestionFavorite(
  questionId: string,
  isFavorite: boolean,
): Promise<void> {
  if (isFavorite) {
    await favoritesApi.removeFavoriteQuestion(questionId);
  } else {
    await favoritesApi.addFavoriteQuestion(questionId);
  }
}
