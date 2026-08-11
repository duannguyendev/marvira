import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { practiceApi } from '../api/practice';
import {
  CreateQuestionInput,
  PracticeQuestionStatus,
  TrainingAnswerSubmission,
} from '../types';
import { useTranslation } from 'react-i18next';
import { useShowAllLanguages } from './useContentLanguage';

export const usePracticeQuestions = (status: PracticeQuestionStatus) => {
  const { i18n } = useTranslation();
  const { showAllLanguages } = useShowAllLanguages();

  return useQuery({
    queryKey: [
      'practice',
      'questions',
      status,
      i18n.language,
      showAllLanguages,
    ],
    queryFn: () => practiceApi.getQuestions(status),
    // Catalog changes slowly; kill app / past this window refetches.
    staleTime: 5 * 60 * 1000,
  });
};

export const usePracticeQuestion = (questionId: string) => {
  return useQuery({
    queryKey: ['practice', 'question', questionId],
    queryFn: () => practiceApi.getQuestionForTraining(questionId),
    enabled: !!questionId,
    staleTime: 30 * 60 * 1000,
  });
};

export const usePracticeQuestionMeta = (questionId: string) => {
  return useQuery({
    queryKey: ['practice', 'question-meta', questionId],
    queryFn: () => practiceApi.getQuestion(questionId),
    enabled: !!questionId,
    staleTime: 30 * 60 * 1000,
  });
};

export const useMyQuestions = () => {
  return useQuery({
    queryKey: ['practice', 'my-questions'],
    queryFn: () => practiceApi.getMyQuestions(),
    staleTime: 5 * 60 * 1000,
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
