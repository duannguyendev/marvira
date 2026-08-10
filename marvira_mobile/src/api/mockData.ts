import {
  Event,
  EventDetails,
  Place,
  User,
  AuthResponse,
  AnswerResponse,
} from '../types';

// Mock User
export const mockUser: User = {
  id: '1',
  email: 'user@example.com',
  name: 'John Doe',
  provider: 'LOCAL',
  hasPassword: true,
  createdAt: new Date().toISOString(),
};

// Mock Events
export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Downtown Adventure',
    description: 'Explore the heart of the city and discover hidden gems',
    imageUrl:
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'in_progress',
    totalPlaces: 5,
    completedPlaces: 2,
    location: {
      latitude: 37.78825,
      longitude: -122.4324,
    },
  },
  {
    id: '2',
    title: 'Historical Tour',
    description: 'Visit historical landmarks and learn about the past',
    imageUrl:
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'not_started',
    totalPlaces: 8,
    completedPlaces: 0,
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
  },
  {
    id: '3',
    title: 'Nature Walk',
    description: 'Enjoy a peaceful walk through nature trails',
    imageUrl:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
    status: 'completed',
    totalPlaces: 6,
    completedPlaces: 6,
    location: {
      latitude: 37.7849,
      longitude: -122.4094,
    },
  },
];

// Mock Places for Event 1
export const mockPlacesEvent1: Place[] = [
  {
    id: 'place-1-1',
    eventId: '1',
    name: 'City Square',
    description: 'The central square of the city',
    location: {
      latitude: 37.78825,
      longitude: -122.4324,
    },
    order: 1,
    radiusMeters: 100,
    isUnlocked: true,
    isAccessible: true,
    isCompleted: true,
  },
  {
    id: 'place-1-2',
    eventId: '1',
    name: 'Historic Library',
    description: 'A beautiful historic library building',
    location: {
      latitude: 37.78925,
      longitude: -122.4334,
    },
    order: 2,
    radiusMeters: 100,
    isUnlocked: true,
    isAccessible: true,
    isCompleted: true,
  },
  {
    id: 'place-1-3',
    eventId: '1',
    name: 'Art Gallery',
    description: 'Modern art gallery with rotating exhibits',
    location: {
      latitude: 37.79025,
      longitude: -122.4344,
    },
    order: 3,
    radiusMeters: 100,
    isUnlocked: true,
    isAccessible: true,
    isCompleted: false,
  },
  {
    id: 'place-1-4',
    eventId: '1',
    name: 'Riverside Park',
    description: 'A peaceful park along the river',
    location: {
      latitude: 37.79125,
      longitude: -122.4354,
    },
    order: 4,
    radiusMeters: 100,
    isUnlocked: false,
    isAccessible: false,
    isCompleted: false,
  },
  {
    id: 'place-1-5',
    eventId: '1',
    name: 'Observation Deck',
    description: 'Highest point with panoramic city views',
    location: {
      latitude: 37.79225,
      longitude: -122.4364,
    },
    order: 5,
    radiusMeters: 100,
    isUnlocked: false,
    isAccessible: false,
    isCompleted: false,
  },
];

export const mockPlaceQuestions: Record<string, string> = {
  'place-1-1': 'What is the name of the statue in the center?',
  'place-1-2': 'In what year was this library built?',
  'place-1-3': 'What is the name of the current featured artist?',
  'place-1-4': 'How many bridges cross the river in this park?',
  'place-1-5': 'What is the height of this observation deck in meters?',
  'place-2-1': 'What is the architectural style of this building?',
};

// Mock Event Details
export const mockEventDetails: Record<string, EventDetails> = {
  '1': {
    ...mockEvents[0],
    places: mockPlacesEvent1,
    progress: 40,
  },
  '2': {
    ...mockEvents[1],
    places: [
      {
        id: 'place-2-1',
        eventId: '2',
        name: 'Museum Entrance',
        description: 'Start your historical journey here',
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
        order: 1,
        radiusMeters: 100,
        isUnlocked: false,
        isAccessible: true,
        isCompleted: false,
      },
    ],
    progress: 0,
  },
  '3': {
    ...mockEvents[2],
    places: [],
    progress: 100,
  },
};

// Mock Answers (correct answers for testing)
export const mockCorrectAnswers: Record<string, string> = {
  'place-1-1': 'Liberty',
  'place-1-2': '1897',
  'place-1-3': 'Van Gogh',
  'place-1-4': '3',
  'place-1-5': '150',
  'place-2-1': 'Neoclassical',
};

// Helper to simulate API delay
export const delay = (ms: number) =>
  new Promise<void>(resolve => setTimeout(() => resolve(), ms));
