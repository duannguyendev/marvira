import { apiClient } from './client';
import { CreateQuestionInput } from '../types';
import { ApiQuestionPublic } from '../types/api';

export interface OwnerPlaceItem {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  question: (ApiQuestionPublic & { answer: string }) | null;
  reporterCount?: number;
  lastReportedAt?: string | null;
}

export interface PlaceAnswerReportSummary {
  placeId: string;
  placeTitle: string;
  orderIndex: number;
  reporterCount: number;
  lastReportedAt: string | null;
}

export const eventOwnerApi = {
  getOwnerPlaces: async (eventId: string): Promise<OwnerPlaceItem[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: OwnerPlaceItem[];
    }>(`/events/${eventId}/owner-places`);
    return response.data.data;
  },

  getAnswerReports: async (
    eventId: string,
  ): Promise<PlaceAnswerReportSummary[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: PlaceAnswerReportSummary[];
    }>(`/events/${eventId}/answer-reports`);
    return response.data.data;
  },

  updateQuestion: async (
    questionId: string,
    input: Partial<CreateQuestionInput>,
  ): Promise<void> => {
    await apiClient.patch(`/questions/${questionId}`, input);
  },
};
