// Types aligned with marvira_dashboard_api / @marvira/shared-types

export type QuestionType =
  | 'TEXT'
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'IMAGE';

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
  createdAt: string;
}

export interface ApiAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiLoginData {
  user: ApiUser;
  tokens: ApiAuthTokens;
}

export interface ApiEvent {
  id: string;
  title: string;
  description: string;
  city: string;
  coverImage: string | null;
  difficulty: string;
  rewardPoints: number;
  isActive: boolean;
  isPasswordProtected?: boolean;
  hasAccess?: boolean;
  createdAt: string;
  updatedAt: string;
  distanceMeters?: number;
  places?: ApiPlace[];
  _count?: {places: number; eventQuestions?: number};
}

export interface ApiPlace {
  id: string;
  eventId: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  orderIndex: number;
  hint: string | null;
  unlocked?: boolean;
  accessible?: boolean;
  completed?: boolean;
  question?: ApiQuestionPublic | null;
}

export interface ApiQuestionPublic {
  id: string;
  question: string;
  type: QuestionType;
  imageUrl: string | null;
  options: string[] | null;
  explanation: string | null;
  points: number;
}

export interface ApiAnswerResponse {
  correct: boolean;
  points: number;
  totalScore: number;
  explanation: string | null;
  nextPlaceId: string | null;
  eventCompleted: boolean;
  answerDurationMs?: number | null;
  eventTotalDurationMs?: number | null;
  alreadyCompleted?: boolean;
}

export interface ApiUnlockResponse {
  unlocked: boolean;
  placeId: string;
  eventId: string;
  currentPlaceIndex: number;
}

export interface ApiCompletedEventProgress {
  id: string;
  userId: string;
  eventId: string;
  score: number;
  completed: boolean;
  completedAt: string | null;
  totalDurationMs?: number | null;
  event: ApiEvent;
}

export interface ApiPaginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiEventLeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  score: number;
  totalDurationMs: number;
  completedAt: string;
}

export interface ApiEventLeaderboardResponse {
  event: {id: string; title: string; city: string};
  entries: ApiEventLeaderboardEntry[];
}

export interface ApiGlobalLeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  totalScore: number;
  eventsCompleted: number;
  avgDurationMs: number | null;
}

export interface ApiGlobalLeaderboardResponse {
  entries: ApiGlobalLeaderboardEntry[];
}
