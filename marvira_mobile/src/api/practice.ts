import { apiClient } from './client';
import { USE_MOCK_DATA } from '../utils/constants';

const USE_PRACTICE_MOCK = USE_MOCK_DATA;
import { practiceMockStore } from './practiceMockStore';
import { practiceStorage } from '../services/practiceStorage';
import { mockUser } from './mockData';
import { storage } from '../utils/storage';
import {
  ApiResponse,
  CreateQuestionInput,
  PracticeQuestion,
  PracticeQuestionListItem,
  PracticeQuestionStatus,
  TrainingAnswerResponse,
  TrainingAnswerSubmission,
} from '../types';

async function getCurrentUser() {
  const user = await storage.getUser();
  if (user?.id) {
    return user;
  }
  if (USE_PRACTICE_MOCK) {
    return mockUser;
  }
  return null;
}

function toListItem(
  question: PracticeQuestion,
  favoriteIds: Set<string>,
  completedIds: Set<string>,
): PracticeQuestionListItem {
  const {
    answer: _answer,
    placeId: _placeId,
    explanation: _explanation,
    ...rest
  } = question;
  return {
    ...rest,
    isFavorite: favoriteIds.has(question.id),
    isTrainingCompleted: completedIds.has(question.id),
  };
}

export const practiceApi = {
  getQuestions: async (
    status: PracticeQuestionStatus,
  ): Promise<ApiResponse<PracticeQuestionListItem[]>> => {
    if (USE_PRACTICE_MOCK) {
      const [published, favoriteIds, completedIds] = await Promise.all([
        practiceMockStore.getPublishedCommunityQuestions(),
        practiceStorage.getFavoriteQuestionIds(),
        practiceStorage.getTrainingCompletedIds(),
      ]);

      const items = published
        .map(q => toListItem(q, favoriteIds, completedIds))
        .filter(q =>
          status === 'completed'
            ? q.isTrainingCompleted
            : !q.isTrainingCompleted,
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

      return { success: true, data: items };
    }

    const response = await apiClient.get<{
      success: boolean;
      data: PracticeQuestionListItem[];
    }>('/practice/questions', { params: { status } });

    return { success: true, data: response.data.data };
  },

  getQuestion: async (
    questionId: string,
  ): Promise<ApiResponse<PracticeQuestionListItem>> => {
    if (USE_PRACTICE_MOCK) {
      const [question, favoriteIds, completedIds] = await Promise.all([
        practiceMockStore.getQuestionById(questionId),
        practiceStorage.getFavoriteQuestionIds(),
        practiceStorage.getTrainingCompletedIds(),
      ]);

      if (!question) {
        throw new Error('Question not found');
      }

      return {
        success: true,
        data: toListItem(question, favoriteIds, completedIds),
      };
    }

    const response = await apiClient.get<{
      success: boolean;
      data: PracticeQuestionListItem;
    }>(`/practice/questions/${questionId}`);

    return { success: true, data: response.data.data };
  },

  getQuestionForTraining: async (
    questionId: string,
  ): Promise<ApiResponse<PracticeQuestion>> => {
    if (USE_PRACTICE_MOCK) {
      const question = await practiceMockStore.getQuestionById(questionId);
      if (!question) {
        throw new Error('Question not found');
      }
      return { success: true, data: question };
    }

    const response = await apiClient.get<{
      success: boolean;
      data: PracticeQuestion;
    }>(`/practice/questions/${questionId}`);

    return { success: true, data: response.data.data };
  },

  getMyQuestions: async (): Promise<
    ApiResponse<PracticeQuestionListItem[]>
  > => {
    const user = await getCurrentUser();
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    if (USE_PRACTICE_MOCK) {
      const [mine, favoriteIds, completedIds] = await Promise.all([
        practiceMockStore.getMyQuestions(user.id),
        practiceStorage.getFavoriteQuestionIds(),
        practiceStorage.getTrainingCompletedIds(),
      ]);

      const items = mine
        .map(q => toListItem(q, favoriteIds, completedIds))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

      return { success: true, data: items };
    }

    const response = await apiClient.get<{
      success: boolean;
      data: PracticeQuestionListItem[];
    }>('/practice/questions/mine');

    return { success: true, data: response.data.data };
  },

  createQuestion: async (
    input: CreateQuestionInput,
  ): Promise<ApiResponse<PracticeQuestion>> => {
    const user = await getCurrentUser();
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    if (USE_PRACTICE_MOCK) {
      const question = await practiceMockStore.createQuestion(
        user.id,
        user.name,
        input,
      );
      return { success: true, data: question };
    }

    const response = await apiClient.post<{
      success: boolean;
      data: PracticeQuestion;
    }>('/practice/questions', input);

    return { success: true, data: response.data.data };
  },

  updateQuestion: async (
    questionId: string,
    input: CreateQuestionInput,
  ): Promise<ApiResponse<PracticeQuestion>> => {
    const user = await getCurrentUser();
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    if (USE_PRACTICE_MOCK) {
      const question = await practiceMockStore.updateQuestion(
        questionId,
        user.id,
        input,
      );
      return { success: true, data: question };
    }

    const response = await apiClient.patch<{
      success: boolean;
      data: PracticeQuestion;
    }>(`/practice/questions/${questionId}`, input);

    return { success: true, data: response.data.data };
  },

  deleteQuestion: async (questionId: string): Promise<ApiResponse<null>> => {
    const user = await getCurrentUser();
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    if (USE_PRACTICE_MOCK) {
      await practiceMockStore.deleteQuestion(questionId, user.id);
      return { success: true, data: null };
    }

    await apiClient.delete(`/practice/questions/${questionId}`);
    return { success: true, data: null };
  },

  submitTrainingAnswer: async (
    questionId: string,
    submission: TrainingAnswerSubmission,
  ): Promise<ApiResponse<TrainingAnswerResponse>> => {
    if (USE_PRACTICE_MOCK) {
      const result = await practiceMockStore.submitTrainingAnswer(
        questionId,
        submission.answer,
      );
      return { success: true, data: result };
    }

    const response = await apiClient.post<{
      success: boolean;
      data: TrainingAnswerResponse;
    }>(`/practice/questions/${questionId}/answer`, submission);

    return { success: true, data: response.data.data };
  },
};
