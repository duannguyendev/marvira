import { apiClient } from './client';
import {
  ApiEventLeaderboardResponse,
  ApiGlobalLeaderboardResponse,
} from '../types/api';

export const leaderboardApi = {
  getEventLeaderboard: async (
    eventId: string,
    limit = 50,
  ): Promise<ApiEventLeaderboardResponse> => {
    const response = await apiClient.get<{
      success: boolean;
      data: ApiEventLeaderboardResponse;
    }>(`/events/${eventId}/leaderboard`, { params: { limit } });
    return response.data.data;
  },

  getGlobalLeaderboard: async (
    limit = 50,
  ): Promise<ApiGlobalLeaderboardResponse> => {
    const response = await apiClient.get<{
      success: boolean;
      data: ApiGlobalLeaderboardResponse;
    }>('/leaderboard/global', { params: { limit } });
    return response.data.data;
  },
};
