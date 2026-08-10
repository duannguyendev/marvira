// Types aligned with marvira_dashboard_api / @marvira/shared-types

export type QuestionType = 'TEXT' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'IMAGE';

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
  provider?: string;
  hasPassword?: boolean;
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
  scheduledPublishAt?: string | null;
  endsAt?: string | null;
  endedAt?: string | null;
  language?: string;
  isPasswordProtected?: boolean;
  hasAccess?: boolean;
  hasGift?: boolean;
  giftCount?: number;
  giftTeaser?: string | null;
  giftCodes?: string[];
  completionMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  distanceMeters?: number;
  places?: ApiPlace[];
  _count?: { places: number; eventQuestions?: number };
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
  answerUpdatedAt?: string | null;
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
  finishRank?: number | null;
  completionMessage?: string | null;
  giftTeaser?: string | null;
  giftCode?: string | null;
  giftCount?: number;
  giftsAllClaimed?: boolean;
}

export interface ApiEventCompletion {
  eventCompleted: true;
  finishRank: number | null;
  completionMessage: string | null;
  giftTeaser: string | null;
  giftCode: string | null;
  giftCount: number;
  giftsAllClaimed: boolean;
  score?: number;
  totalDurationMs?: number | null;
}

export interface ApiEventFinisher {
  userId: string;
  userName: string;
  completedAt: string;
  totalDurationMs: number | null;
  score: number;
  finishRank: number | null;
  giftCodeAwarded: string | null;
}

export interface ApiEventFinishersResponse {
  event: { id: string; title: string; city: string };
  giftCount: number;
  giftAssignedCount: number;
  finishers: ApiEventFinisher[];
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
  event: { id: string; title: string; city: string };
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
