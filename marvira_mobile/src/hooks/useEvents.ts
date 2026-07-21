import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {eventsApi} from '../api/events';
import {EventFilters, Location} from '../types';

export const useEvents = (filters?: EventFilters, userLocation?: Location) => {
  return useQuery({
    queryKey: ['events', filters, userLocation],
    queryFn: () => eventsApi.getEvents(filters, userLocation),
    staleTime: 30000,
  });
};

export const useEventDetails = (eventId: string) => {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.getEventDetails(eventId),
    enabled: !!eventId,
    staleTime: 30000,
  });
};

export const useJoinEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({eventId, password}: {eventId: string; password: string}) =>
      eventsApi.joinEvent(eventId, password),
    onSuccess: (_data, {eventId}) => {
      queryClient.invalidateQueries({queryKey: ['event', eventId]});
      queryClient.invalidateQueries({queryKey: ['events']});
    },
  });
};
