import { useQuery } from '@tanstack/react-query';
import { profileApi } from '../api/profile';

export const useCompletedEvents = () => {
  return useQuery({
    queryKey: ['completed-events'],
    queryFn: () => profileApi.getCompletedEvents(),
    staleTime: 60000,
  });
};
