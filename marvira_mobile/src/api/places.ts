import {
  Place,
  AnswerSubmission,
  AnswerResponse,
  ApiResponse,
  PlaceQuestion,
  UnlockPlaceRequest,
  LocationWarning,
} from '../types';
import { USE_MOCK_DATA } from '../utils/constants';
import {
  mockPlacesEvent1,
  mockCorrectAnswers,
  mockEventDetails,
  mockPlaceQuestions,
  delay,
} from './mockData';
import { apiClient } from './client';
import {
  ApiAnswerResponse,
  ApiPlace,
  ApiQuestionPublic,
  ApiUnlockResponse,
} from '../types/api';
import { mapPlace, mapQuestion } from './mappers';
import { buildLocationPayload } from '../utils/anticheat';

export type UnlockPlaceResult = ApiResponse<Place> & {
  warnings?: LocationWarning[];
};
export type SubmitAnswerResult = ApiResponse<AnswerResponse>;

export const placesApi = {
  getPlaceFromEvent: (
    eventPlaces: Place[] | undefined,
    placeId: string,
  ): Place | undefined => eventPlaces?.find(p => p.id === placeId),

  getPlaceQuestion: async (
    placeId: string,
  ): Promise<ApiResponse<PlaceQuestion>> => {
    if (USE_MOCK_DATA) {
      await delay(400);
      const allPlaces = [
        ...mockPlacesEvent1,
        ...(mockEventDetails['2']?.places || []),
      ];
      const place = allPlaces.find(p => p.id === placeId);
      if (!place) {
        throw new Error('Place not found');
      }
      return {
        success: true,
        data: {
          id: placeId,
          text: mockPlaceQuestions[placeId] || 'Sample question?',
          type: 'TEXT',
          points: 10,
        },
      };
    }

    const response = await apiClient.get<{
      success: boolean;
      data: ApiQuestionPublic;
    }>(`/places/${placeId}/question`);

    return {
      success: true,
      data: mapQuestion(response.data.data),
    };
  },

  unlockPlace: async (
    request: UnlockPlaceRequest,
  ): Promise<UnlockPlaceResult> => {
    if (USE_MOCK_DATA) {
      await delay(400);
      const allPlaces = [
        ...mockPlacesEvent1,
        ...(mockEventDetails['2']?.places || []),
      ];
      const place = allPlaces.find(p => p.id === request.placeId);
      if (place) {
        place.isUnlocked = true;
        return { success: true, data: place };
      }
      throw new Error('Place not found');
    }

    const response = await apiClient.post<{
      success: boolean;
      data: ApiUnlockResponse;
      warnings?: LocationWarning[];
    }>(`/places/${request.placeId}/unlock`, buildLocationPayload(request));

    const placesRes = await apiClient.get<{
      success: boolean;
      data: ApiPlace[];
    }>(`/events/${response.data.data.eventId}/places`);
    const apiPlace = placesRes.data.data.find(p => p.id === request.placeId);
    if (!apiPlace) {
      throw new Error('Place not found after unlock');
    }

    return {
      success: true,
      data: mapPlace(apiPlace),
      warnings: response.data.warnings,
    };
  },

  submitAnswer: async (
    submission: AnswerSubmission,
  ): Promise<ApiResponse<AnswerResponse>> => {
    if (USE_MOCK_DATA) {
      await delay(600);
      const correctAnswer = mockCorrectAnswers[submission.placeId];
      const isCorrect =
        correctAnswer &&
        submission.answer.toLowerCase().trim() ===
          correctAnswer.toLowerCase().trim();

      const allPlaces = [
        ...mockPlacesEvent1,
        ...(mockEventDetails['2']?.places || []),
      ];
      const place = allPlaces.find(p => p.id === submission.placeId);
      const eventId = place?.eventId;

      if (isCorrect && place && eventId) {
        place.isCompleted = true;
        const eventDetails = mockEventDetails[eventId];
        if (eventDetails) {
          const currentIndex = eventDetails.places.findIndex(
            p => p.id === submission.placeId,
          );
          const nextPlace = eventDetails.places[currentIndex + 1];
          if (nextPlace) {
            nextPlace.isUnlocked = true;
          }
          const allCompleted =
            eventDetails.places.every(p => p.isCompleted) &&
            eventDetails.places.length > 0;

          return {
            success: true,
            data: {
              isCorrect: true,
              message: 'Correct answer! Great job!',
              nextPlaceUnlocked: !!nextPlace,
              nextPlaceId: nextPlace?.id ?? null,
              eventCompleted: allCompleted,
            },
          };
        }
      }

      return {
        success: true,
        data: {
          isCorrect: false,
          message: 'Incorrect answer. Please try again!',
        },
      };
    }

    const response = await apiClient.post<{
      success: boolean;
      data: ApiAnswerResponse;
      warnings?: LocationWarning[];
    }>(`/places/${submission.placeId}/answer`, {
      answer: submission.answer,
      ...buildLocationPayload(submission),
    });

    const result = response.data.data;
    return {
      success: true,
      data: {
        isCorrect: result.correct,
        message: result.correct
          ? result.explanation || 'Correct answer! Great job!'
          : 'Incorrect answer. Please try again!',
        points: result.points,
        totalScore: result.totalScore,
        explanation: result.explanation,
        nextPlaceId: result.nextPlaceId,
        nextPlaceUnlocked: !!result.nextPlaceId,
        eventCompleted: result.eventCompleted,
        answerDurationMs: result.answerDurationMs,
        eventTotalDurationMs: result.eventTotalDurationMs,
        warnings: response.data.warnings,
        finishRank: result.finishRank,
        completionMessage: result.completionMessage,
        giftTeaser: result.giftTeaser,
        giftCode: result.giftCode,
        giftCount: result.giftCount,
        giftsAllClaimed: result.giftsAllClaimed,
      },
    };
  },
};
