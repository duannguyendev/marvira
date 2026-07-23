import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { placesApi } from '../api/places';
import { AnswerSubmission, UnlockPlaceRequest } from '../types';

export const usePlaceQuestion = (placeId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ['place-question', placeId],
    queryFn: () => placesApi.getPlaceQuestion(placeId),
    enabled: !!placeId && enabled,
    staleTime: 0,
  });
};

export const useSubmitAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submission: AnswerSubmission) =>
      placesApi.submitAnswer(submission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['completed-events'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
};

export const useUnlockPlace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UnlockPlaceRequest) => placesApi.unlockPlace(request),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({
        queryKey: ['place-question', variables.placeId],
      });
    },
  });
};
