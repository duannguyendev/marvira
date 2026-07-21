import {
  Event,
  EventDetails,
  ApiResponse,
  EventFilters,
  Location,
} from '../types';
import {USE_MOCK_DATA} from '../utils/constants';
import {mockEvents, mockEventDetails, delay} from './mockData';
import {calculateDistance} from '../utils/distance';
import {apiClient} from './client';
import {ApiEvent, ApiPaginated, ApiPlace} from '../types/api';
import {mapEvent, mapEventDetails} from './mappers';
import {profileApi} from './profile';

async function getCompletedEventIds(): Promise<Set<string>> {
  try {
    const res = await profileApi.getCompletedEvents();
    return new Set(res.data.map(e => e.id));
  } catch {
    return new Set();
  }
}

export const eventsApi = {
  getEvents: async (
    filters?: EventFilters,
    userLocation?: Location,
  ): Promise<ApiResponse<Event[]>> => {
    if (USE_MOCK_DATA) {
      await delay(600);
      let filteredEvents = [...mockEvents];

      if (filters?.status) {
        filteredEvents = filteredEvents.filter(
          event => event.status === filters.status,
        );
      }

      if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredEvents = filteredEvents.filter(
          event =>
            event.title.toLowerCase().includes(query) ||
            event.description.toLowerCase().includes(query),
        );
      }

      if (userLocation) {
        filteredEvents = filteredEvents.map(event => ({
          ...event,
          distance: calculateDistance(userLocation, event.location),
        }));

        if (filters?.radius) {
          const radiusFiltered = filteredEvents.filter(
            event => event.distance && event.distance <= filters.radius!,
          );
          if (radiusFiltered.length > 0) {
            filteredEvents = radiusFiltered;
          }
        }

        filteredEvents.sort((a, b) => {
          const distA = a.distance || Infinity;
          const distB = b.distance || Infinity;
          return distA - distB;
        });
      }

      return {success: true, data: filteredEvents};
    }

    const completedIds = await getCompletedEventIds();

    if (filters?.status === 'completed') {
      const completed = await profileApi.getCompletedEvents();
      let events = completed.data;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        events = events.filter(
          e =>
            e.title.toLowerCase().includes(q) ||
            e.description.toLowerCase().includes(q),
        );
      }
      return {success: true, data: events};
    }

    let apiEvents: ApiEvent[] = [];

    if (userLocation) {
      const radiusKm = (filters?.radius ?? 5000) / 1000;
      const response = await apiClient.get<{success: boolean; data: ApiEvent[]}>(
        '/events/nearby',
        {
          params: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            radiusKm,
          },
        },
      );
      apiEvents = response.data.data;
    } else {
      const response = await apiClient.get<{
        success: boolean;
        data: ApiPaginated<ApiEvent>;
      }>('/events', {
        params: {
          page: 1,
          pageSize: 50,
          ...(filters?.searchQuery ? {search: filters.searchQuery} : {}),
        },
      });
      apiEvents = response.data.data.items;
    }

    let events = apiEvents.map(e => mapEvent(e, completedIds));

    if (filters?.searchQuery && userLocation) {
      const q = filters.searchQuery.toLowerCase();
      events = events.filter(
        e =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          (e.city?.toLowerCase().includes(q) ?? false),
      );
    }

    if (filters?.status === 'in_progress') {
      events = events.filter(e => e.status === 'in_progress');
    } else if (filters?.status === 'not_started') {
      events = events.filter(e => e.status === 'not_started');
    }

    return {success: true, data: events};
  },

  getEventDetails: async (
    eventId: string,
  ): Promise<ApiResponse<EventDetails>> => {
    if (USE_MOCK_DATA) {
      await delay(500);
      const eventDetails = mockEventDetails[eventId];
      if (eventDetails) {
        return {success: true, data: eventDetails};
      }
      throw new Error('Event not found');
    }

    const completedIds = await getCompletedEventIds();

    const [eventRes, placesRes] = await Promise.all([
      apiClient.get<{success: boolean; data: ApiEvent}>(`/events/${eventId}`),
      apiClient.get<{success: boolean; data: ApiPlace[]}>(
        `/events/${eventId}/places`,
      ),
    ]);

    const details = mapEventDetails(
      eventRes.data.data,
      placesRes.data.data,
      completedIds,
    );

    return {success: true, data: details};
  },

  joinEvent: async (
    eventId: string,
    password: string,
  ): Promise<ApiResponse<{joined: boolean; hasAccess: boolean}>> => {
    const response = await apiClient.post<{
      success: boolean;
      data: {joined: boolean; hasAccess: boolean};
    }>(`/events/${eventId}/join`, {password});
    return {success: true, data: response.data.data};
  },
};
