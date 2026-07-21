import {apiClient} from './client';
import {
  ApiResponse,
  FeedbackCategory,
  FeedbackItem,
  FeedbackSource,
} from '../types';

export interface SubmitFeedbackInput {
  category: FeedbackCategory;
  subject?: string;
  message: string;
}

export const feedbackApi = {
  submit: async (
    input: SubmitFeedbackInput,
  ): Promise<ApiResponse<FeedbackItem>> => {
    const response = await apiClient.post<{
      success: boolean;
      data: FeedbackItem;
      message?: string;
    }>('/feedback', {
      ...input,
      source: FeedbackSource.MOBILE,
    });

    return {success: true, data: response.data.data};
  },
};
