import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventCreationApi } from '../api/eventCreation';
import {
  CreateEventInput,
  CreatePlaceInput,
  CreateQuestionInput,
  PublishEventInput,
} from '../types';

export const useMyEvents = () => {
  return useQuery({
    queryKey: ['myEvents'],
    queryFn: () => eventCreationApi.getMyEvents(),
    staleTime: 30000,
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventInput) =>
      eventCreationApi.createEvent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
    },
  });
};

export const useCreatePlaceWithQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      orderIndex,
      place,
      question,
    }: {
      eventId: string;
      orderIndex: number;
      place: CreatePlaceInput;
      question: CreateQuestionInput;
    }) =>
      eventCreationApi.createPlaceWithQuestion(
        eventId,
        orderIndex,
        place,
        question,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      queryClient.invalidateQueries({ queryKey: ['event', variables.eventId] });
    },
  });
};

export const usePublishEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      ...input
    }: { eventId: string } & PublishEventInput) =>
      eventCreationApi.publishEvent(eventId, input),
    onSuccess: (_data, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });
};

export const useUpdateEventGifts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      ...input
    }: {
      eventId: string;
      completionMessage?: string | null;
      giftTeaser?: string | null;
      giftCodes?: string[];
    }) => eventCreationApi.updateEventGifts(eventId, input),
    onSuccess: (_data, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['eventFinishers', eventId] });
    },
  });
};
