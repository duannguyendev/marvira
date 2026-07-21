import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  favoritesApi,
  toggleEventFavorite,
  toggleQuestionFavorite,
} from '../api/favorites';

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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({queryKey: ['favorites']});
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({queryKey: ['favorites']});
      queryClient.invalidateQueries({queryKey: ['practice']});
      queryClient.invalidateQueries({
        queryKey: ['favorites', 'question', variables.questionId],
      });
    },
  });
};
