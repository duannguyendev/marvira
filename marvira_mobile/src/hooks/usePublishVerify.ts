import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { publishVerifyApi } from '../api/publishVerify';

export const usePublishVerifyStatus = (eventId: string) => {
  return useQuery({
    queryKey: ['publishVerifyStatus', eventId],
    queryFn: () => publishVerifyApi.getStatus(eventId),
    staleTime: 5000,
  });
};

export const usePublishVerifyQuestions = (eventId: string) => {
  return useQuery({
    queryKey: ['publishVerifyQuestions', eventId],
    queryFn: () => publishVerifyApi.getQuestions(eventId),
    staleTime: 5000,
  });
};

export const useSubmitPublishVerify = (eventId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questionId,
      answer,
    }: {
      questionId: string;
      answer: string;
    }) => publishVerifyApi.submitVerify(eventId, questionId, answer),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['publishVerifyStatus', eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ['publishVerifyQuestions', eventId],
      });
    },
  });
};
