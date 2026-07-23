import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { practiceApi } from '../api/practice';
import {
  CreateQuestionInput,
  PracticeQuestionStatus,
  TrainingAnswerSubmission,
} from '../types';

export const usePracticeQuestions = (status: PracticeQuestionStatus) => {
  return useQuery({
    queryKey: ['practice', 'questions', status],
    queryFn: () => practiceApi.getQuestions(status),
    staleTime: 15000,
  });
};

export const usePracticeQuestion = (questionId: string) => {
  return useQuery({
    queryKey: ['practice', 'question', questionId],
    queryFn: () => practiceApi.getQuestionForTraining(questionId),
    enabled: !!questionId,
  });
};

export const usePracticeQuestionMeta = (questionId: string) => {
  return useQuery({
    queryKey: ['practice', 'question-meta', questionId],
    queryFn: () => practiceApi.getQuestion(questionId),
    enabled: !!questionId,
  });
};

export const useMyQuestions = () => {
  return useQuery({
    queryKey: ['practice', 'my-questions'],
    queryFn: () => practiceApi.getMyQuestions(),
    staleTime: 15000,
  });
};

export const useSubmitTrainingAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      questionId,
      submission,
    }: {
      questionId: string;
      submission: TrainingAnswerSubmission;
    }) => practiceApi.submitTrainingAnswer(questionId, submission),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['practice'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({
        queryKey: ['practice', 'question', variables.questionId],
      });
    },
  });
};

export const useCreatePracticeQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateQuestionInput) =>
      practiceApi.createQuestion(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice'] });
    },
  });
};

export const useUpdatePracticeQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      questionId,
      input,
    }: {
      questionId: string;
      input: CreateQuestionInput;
    }) => practiceApi.updateQuestion(questionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice'] });
    },
  });
};

export const useDeletePracticeQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId: string) => practiceApi.deleteQuestion(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};
