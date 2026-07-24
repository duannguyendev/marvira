// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  refreshToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

// Event Types
export type EventStatus = 'not_started' | 'in_progress' | 'completed';

export interface Event {
  id: string;
  title: string;
  description: string;
  city?: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  totalPlaces: number;
  completedPlaces: number;
  distance?: number;
  location: {
    latitude: number;
    longitude: number;
  };
  rewardPoints?: number;
  score?: number;
  totalDurationMs?: number | null;
  isPasswordProtected?: boolean;
  hasAccess?: boolean;
  hasGift?: boolean;
  giftCount?: number;
  giftTeaser?: string | null;
  /** Owner-only */
  giftCodes?: string[];
  /** Owner-only on detail; also on completion payload */
  completionMessage?: string | null;
  language?: string;
}

export interface EventDetails extends Event {
  places: Place[];
  progress: number;
}

// Place Types
export interface Place {
  id: string;
  eventId: string;
  name: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  order: number;
  radiusMeters: number;
  isUnlocked: boolean;
  isAccessible: boolean;
  isCompleted: boolean;
  distance?: number;
  hint?: string;
}

export type QuestionType = 'TEXT' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'IMAGE';

export interface PlaceQuestion {
  id: string;
  text: string;
  type: QuestionType;
  imageUrl?: string;
  options?: string[];
  points: number;
}

// Answer Types
export interface AnswerSubmission {
  placeId: string;
  answer: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface AnswerResponse {
  isCorrect: boolean;
  message: string;
  points?: number;
  totalScore?: number;
  explanation?: string | null;
  nextPlaceId?: string | null;
  nextPlaceUnlocked?: boolean;
  eventCompleted?: boolean;
  answerDurationMs?: number | null;
  eventTotalDurationMs?: number | null;
  warnings?: LocationWarning[];
  finishRank?: number | null;
  completionMessage?: string | null;
  giftTeaser?: string | null;
  giftCode?: string | null;
  giftCount?: number;
  giftsAllClaimed?: boolean;
}

export interface UnlockPlaceRequest {
  placeId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface LocationWarning {
  code: string;
  message: string;
}

// Location Types
export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// Filter Types
export interface EventFilters {
  radius: number;
  status?: EventStatus;
  searchQuery?: string;
}

export type EventDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface MyCreatedEvent extends Event {
  isPublished: boolean;
  difficulty: EventDifficulty;
}

export interface CreateEventInput {
  title: string;
  description: string;
  city: string;
  difficulty: EventDifficulty;
  rewardPoints: number;
  language?: string;
  completionMessage?: string | null;
  giftTeaser?: string | null;
  giftCodes?: string[];
}

export interface PublishEventInput {
  joinPassword?: string;
  clearJoinPassword?: boolean;
  completionMessage?: string | null;
  giftTeaser?: string | null;
  giftCodes?: string[];
}

export interface EventCompletionInfo {
  finishRank: number | null;
  completionMessage: string | null;
  giftTeaser: string | null;
  giftCode: string | null;
  giftCount: number;
  giftsAllClaimed: boolean;
  score?: number;
  totalDurationMs?: number | null;
}

export interface CreatePlaceInput {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  hint?: string;
}

export interface CreateQuestionInput {
  question: string;
  type: QuestionType;
  answer: string;
  options?: string[];
  points?: number;
  imageUrl?: string;
  language?: string;
}

export type QuestionSource = 'community' | 'event';

export type PracticeQuestionStatus = 'unfinished' | 'completed';

export interface PracticeQuestion {
  id: string;
  text: string;
  type: QuestionType;
  imageUrl?: string;
  options?: string[];
  points: number;
  language?: string;
  answer: string;
  explanation?: string;
  authorId: string;
  authorName: string;
  source: QuestionSource;
  eventId?: string;
  eventTitle?: string;
  placeId?: string;
  isPublished: boolean;
  createdAt: string;
}

export interface PracticeQuestionListItem {
  id: string;
  text: string;
  type: QuestionType;
  imageUrl?: string;
  options?: string[];
  points: number;
  language?: string;
  authorId: string;
  authorName: string;
  source: QuestionSource;
  eventId?: string;
  eventTitle?: string;
  isPublished: boolean;
  createdAt: string;
  isFavorite: boolean;
  isTrainingCompleted: boolean;
}

export interface TrainingAnswerSubmission {
  answer: string;
}

export interface TrainingAnswerResponse {
  isCorrect: boolean;
  message: string;
  explanation?: string | null;
}

export interface UpdatePracticeQuestionInput extends CreateQuestionInput {}

export enum FeedbackCategory {
  FEEDBACK = 'FEEDBACK',
  SUGGESTION = 'SUGGESTION',
  BUG = 'BUG',
  OTHER = 'OTHER',
}

export enum FeedbackSource {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
}

export interface FeedbackItem {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  category: FeedbackCategory;
  subject: string | null;
  message: string;
  source: FeedbackSource;
  status: string;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  Feedback: undefined;
};

export type MainTabParamList = {
  Home:
    | undefined
    | {
        screen: keyof HomeStackParamList;
        params?: HomeStackParamList[keyof HomeStackParamList];
      };
  Profile:
    | undefined
    | {
        screen: keyof ProfileStackParamList;
        params?: ProfileStackParamList[keyof ProfileStackParamList];
      };
};

export type HomeStackParamList = {
  EventsList: undefined;
  EventDetails: { eventId: string };
  PlaceGame: { eventId: string; placeId: string };
  EventCompletion: { eventId: string; score?: number };
};
