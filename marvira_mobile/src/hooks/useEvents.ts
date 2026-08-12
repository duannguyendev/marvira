import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { eventsApi } from '../api/events';
import { EventFilters, Location } from '../types';
import { toLocationQueryKey } from '../utils/distance';
import { useShowAllLanguages } from './useContentLanguage';

export const useEvents = (filters?: EventFilters, userLocation?: Location) => {
  const { i18n } = useTranslation();
  const { showAllLanguages } = useShowAllLanguages();
  const radius = filters?.radius;
  const usesNearby = radius != null && radius > 0;

  return useQuery({
    queryKey: [
      'events',
      {
        radius: radius ?? null,
        status: filters?.status,
        searchQuery: filters?.searchQuery,
      },
      // Nearby depends on coords; "All" list does not. Never key on
      // timestamp/accuracy — GPS refresh remounted the list and scrolled to top.
      usesNearby ? toLocationQueryKey(userLocation) : null,
      i18n.language,
      showAllLanguages,
    ],
    queryFn: () => eventsApi.getEvents(filters, userLocation),
    // Hunt catalog is relatively stable; mutations invalidate as needed.
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useEventDetails = (eventId: string) => {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.getEventDetails(eventId),
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
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
