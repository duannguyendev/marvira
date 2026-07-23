import { useQuery } from '@tanstack/react-query';
import { leaderboardApi } from '../api/leaderboard';

export const useEventLeaderboard = (eventId: string) => {
  return useQuery({
    queryKey: ['leaderboard', 'event', eventId],
    queryFn: () => leaderboardApi.getEventLeaderboard(eventId),
    enabled: !!eventId,
    staleTime: 30000,
  });
};

export const useGlobalLeaderboard = () => {
  return useQuery({
    queryKey: ['leaderboard', 'global'],
    queryFn: () => leaderboardApi.getGlobalLeaderboard(),
    staleTime: 30000,
  });
};
