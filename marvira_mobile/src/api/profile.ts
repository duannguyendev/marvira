import { ApiResponse, Event } from '../types';
import { USE_MOCK_DATA } from '../utils/constants';
import { mockEvents, delay } from './mockData';
import { apiClient } from './client';
import { ApiCompletedEventProgress } from '../types/api';
import { mapCompletedProgress } from './mappers';

export const profileApi = {
  getCompletedEvents: async (): Promise<ApiResponse<Event[]>> => {
    if (USE_MOCK_DATA) {
      await delay(400);
      const completed = mockEvents.filter(e => e.status === 'completed');
      return { success: true, data: completed };
    }

    const response = await apiClient.get<{
      success: boolean;
      data: ApiCompletedEventProgress[];
    }>('/profile/completed-events');

    return {
      success: true,
      data: response.data.data.map(mapCompletedProgress),
    };
  },
};
