import { apiClient } from './client';
import { QuestionType } from '../types';

export interface PublishVerifyStatus {
  totalCount: number;
  verifiedCount: number;
  verifiedQuestionIds: string[];
  allVerified: boolean;
}

export interface PublishVerifyQuestionItem {
  placeId: string;
  placeTitle: string;
  placeOrderIndex: number;
  question: {
    id: string;
    question: string;
    type: QuestionType;
    imageUrl?: string | null;
    options?: string[] | null;
    points: number;
  };
  verified: boolean;
}

export interface SubmitPublishVerifyResult {
  correct: boolean;
  verifiedCount: number;
  totalCount: number;
}

export const publishVerifyApi = {
  getStatus: async (eventId: string): Promise<PublishVerifyStatus> => {
    const response = await apiClient.get<{
      success: boolean;
      data: PublishVerifyStatus;
    }>(`/events/${eventId}/publish-verify/status`);
    return response.data.data;
  },

  getQuestions: async (eventId: string): Promise<PublishVerifyQuestionItem[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: PublishVerifyQuestionItem[];
    }>(`/events/${eventId}/publish-verify/questions`);
    return response.data.data;
  },

  submitVerify: async (
    eventId: string,
    questionId: string,
    answer: string,
  ): Promise<SubmitPublishVerifyResult> => {
    const response = await apiClient.post<{
      success: boolean;
      data: SubmitPublishVerifyResult;
    }>(`/events/${eventId}/publish-verify`, { questionId, answer });
    return response.data.data;
  },
};
