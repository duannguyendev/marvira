import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectGameSocket, disconnectGameSocket } from '../api/websocket';
import { useAuth } from './useAuth';

export const useGameSocket = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectGameSocket();
      return;
    }

    connectGameSocket({
      onProgressUpdated: _payload => {
        queryClient.invalidateQueries({ queryKey: ['event'] });
        queryClient.invalidateQueries({ queryKey: ['events'] });
      },
      onPlaceUnlocked: () => {
        queryClient.invalidateQueries({ queryKey: ['event'] });
      },
      onEventCompleted: () => {
        queryClient.invalidateQueries({ queryKey: ['event'] });
        queryClient.invalidateQueries({ queryKey: ['events'] });
        queryClient.invalidateQueries({ queryKey: ['completed-events'] });
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      },
    });

    return () => {
      disconnectGameSocket();
    };
  }, [isAuthenticated, queryClient]);
};
