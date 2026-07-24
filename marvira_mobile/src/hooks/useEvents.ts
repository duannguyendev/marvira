import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { eventsApi } from '../api/events';
import { EventFilters, Location } from '../types';
import { useShowAllLanguages } from './useContentLanguage';

export const useEvents = (filters?: EventFilters, userLocation?: Location) => {
  const { i18n } = useTranslation();
  const { showAllLanguages } = useShowAllLanguages();

  return useQuery({
    queryKey: [
      'events',
      filters,
      userLocation,
      i18n.language,
      showAllLanguages,
    ],
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
    mutationFn: ({
      eventId,
      password,
    }: {
      eventId: string;
      password: string;
    }) => eventsApi.joinEvent(eventId, password),
    onSuccess: (_data, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};
