import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  favoritesApi,
  toggleEventFavorite,
  toggleQuestionFavorite,
} from '../api/favorites';
import { ApiResponse, Event, PracticeQuestionListItem } from '../types';

export const useFavoriteEvents = () => {
  return useQuery({
    queryKey: ['favorites', 'events'],
    queryFn: () => favoritesApi.getFavoriteEvents(),
    staleTime: 15000,
  });
};

export const useFavoriteQuestions = () => {
  return useQuery({
    queryKey: ['favorites', 'questions'],
    queryFn: () => favoritesApi.getFavoriteQuestions(),
    staleTime: 15000,
  });
};

export const useIsEventFavorite = (eventId: string) => {
  return useQuery({
    queryKey: ['favorites', 'event', eventId],
    queryFn: () => favoritesApi.isEventFavorite(eventId),
    enabled: !!eventId,
    staleTime: 10000,
  });
};

export const useIsQuestionFavorite = (questionId: string) => {
  return useQuery({
    queryKey: ['favorites', 'question', questionId],
    queryFn: () => favoritesApi.isQuestionFavorite(questionId),
    enabled: !!questionId,
    staleTime: 10000,
  });
};

type QuestionListCache = ApiResponse<PracticeQuestionListItem[]>;
type EventListCache = ApiResponse<Event[]>;

function patchQuestionFavoriteFlag(
  old: QuestionListCache | undefined,
  questionId: string,
  isFavorite: boolean,
): QuestionListCache | undefined {
  if (!old?.data) {
    return old;
  }
  return {
    ...old,
    data: old.data.map(q =>
      q.id === questionId ? { ...q, isFavorite } : q,
    ),
  };
}

export const useToggleEventFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      isFavorite,
    }: {
      eventId: string;
      isFavorite: boolean;
    }) => toggleEventFavorite(eventId, isFavorite),
    onMutate: async ({ eventId, isFavorite }) => {
      const nextFavorite = !isFavorite;
      await queryClient.cancelQueries({ queryKey: ['favorites'] });

      const previousFavorites = queryClient.getQueriesData<EventListCache>({
        queryKey: ['favorites', 'events'],
      });
      const previousIsFavorite = queryClient.getQueryData<boolean>([
        'favorites',
        'event',
        eventId,
      ]);

      queryClient.setQueryData(['favorites', 'event', eventId], nextFavorite);
      queryClient.setQueriesData<EventListCache>(
        { queryKey: ['favorites', 'events'] },
        old => {
          if (!old?.data) {
            return old;
          }
          if (nextFavorite) {
            return old;
          }
          return {
            ...old,
            data: old.data.filter(e => e.id !== eventId),
          };
        },
      );

      return { previousFavorites, previousIsFavorite, eventId };
    },
    onError: (_error, _variables, context) => {
      if (!context) {
        return;
      }
      context.previousFavorites.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      queryClient.setQueryData(
        ['favorites', 'event', context.eventId],
        context.previousIsFavorite,
      );
    },
    onSettled: (_data, _error, variables) => {
      // Background sync for Favorites tab; list screens no longer flash RefreshControl.
      queryClient.invalidateQueries({ queryKey: ['favorites', 'events'] });
      queryClient.invalidateQueries({
        queryKey: ['favorites', 'event', variables.eventId],
      });
    },
  });
};

export const useToggleQuestionFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      questionId,
      isFavorite,
    }: {
      questionId: string;
      isFavorite: boolean;
    }) => toggleQuestionFavorite(questionId, isFavorite),
    onMutate: async ({ questionId, isFavorite }) => {
      const nextFavorite = !isFavorite;

      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['practice'] }),
        queryClient.cancelQueries({ queryKey: ['favorites'] }),
      ]);

      const previousPractice = queryClient.getQueriesData<QuestionListCache>({
        queryKey: ['practice'],
      });
      const previousFavorites = queryClient.getQueriesData<QuestionListCache>({
        queryKey: ['favorites', 'questions'],
      });
      const previousIsFavorite = queryClient.getQueryData<boolean>([
        'favorites',
        'question',
        questionId,
      ]);

      // Instant star toggle on practice / my-questions lists — no full refetch.
      queryClient.setQueriesData<QuestionListCache>(
        { queryKey: ['practice', 'questions'] },
        old => patchQuestionFavoriteFlag(old, questionId, nextFavorite),
      );
      queryClient.setQueriesData<QuestionListCache>(
        { queryKey: ['practice', 'my-questions'] },
        old => patchQuestionFavoriteFlag(old, questionId, nextFavorite),
      );
      queryClient.setQueryData(
        ['favorites', 'question', questionId],
        nextFavorite,
      );
      queryClient.setQueriesData<QuestionListCache>(
        { queryKey: ['favorites', 'questions'] },
        old => {
          if (!old?.data) {
            return old;
          }
          if (nextFavorite) {
            return patchQuestionFavoriteFlag(old, questionId, true);
          }
          return {
            ...old,
            data: old.data.filter(q => q.id !== questionId),
          };
        },
      );

      return {
        previousPractice,
        previousFavorites,
        previousIsFavorite,
        questionId,
      };
    },
    onError: (_error, _variables, context) => {
      if (!context) {
        return;
      }
      context.previousPractice.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      context.previousFavorites.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      queryClient.setQueryData(
        ['favorites', 'question', context.questionId],
        context.previousIsFavorite,
      );
    },
    onSettled: (_data, _error, variables) => {
      // Sync Favorites tab in background — do not invalidate practice (that caused list spinner jank).
      queryClient.invalidateQueries({ queryKey: ['favorites', 'questions'] });
      queryClient.invalidateQueries({
        queryKey: ['favorites', 'question', variables.questionId],
      });
    },
  });
};
