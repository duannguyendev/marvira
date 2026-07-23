export enum UserRole {
  USER = 'USER',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}

/** Roles that may access the admin dashboard. */
export function isDashboardRole(role: UserRole | string): boolean {
  return role === UserRole.ADMIN || role === UserRole.STAFF;
}

export enum AuthProvider {
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK',
  APPLE = 'APPLE',
  LOCAL = 'LOCAL',
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TEXT = 'TEXT',
  TRUE_FALSE = 'TRUE_FALSE',
  IMAGE = 'IMAGE',
}

export enum EventDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  provider: AuthProvider;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  city: string;
  coverImage: string | null;
  difficulty: EventDifficulty;
  rewardPoints: number;
  isActive: boolean;
  isPasswordProtected: boolean;
  hasAccess?: boolean;
  /** Derived: giftCodes.length > 0 — safe for public list/detail */
  hasGift?: boolean;
  /** Derived: giftCodes.length — safe for public (“first N” finishers) */
  giftCount?: number;
  /** Short public description of the gift; never a code */
  giftTeaser?: string | null;
  /** Owner/admin only — omitted on public list/detail */
  giftCodes?: string[];
  /** Owner/admin or completion payload — omitted on public list/detail */
  completionMessage?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  distanceMeters?: number;
}

export interface Place {
  id: string;
  eventId: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  orderIndex: number;
  hint: string | null;
  createdAt: string;
  unlocked?: boolean;
  accessible?: boolean;
  completed?: boolean;
}

export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  imageUrl: string | null;
  options: string[] | null;
  explanation: string | null;
  points: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Admin-only — includes the correct answer */
export interface AdminQuestion extends Question {
  answer: string;
}

export interface EventQuestionLink {
  id: string;
  eventId: string;
  questionId: string;
  orderIndex: number;
  question?: AdminQuestion;
  event?: Pick<Event, 'id' | 'title' | 'city' | 'isActive'>;
}

export interface QuestionListItem extends AdminQuestion {
  _count?: { eventQuestions: number; places: number };
  eventQuestions?: Array<{
    event: Pick<Event, 'id' | 'title'>;
  }>;
}

export interface QuestionDetail extends AdminQuestion {
  eventQuestions: Array<{
    id: string;
    orderIndex: number;
    event: Pick<Event, 'id' | 'title' | 'city' | 'isActive'>;
  }>;
  places: Array<{
    id: string;
    title: string;
    eventId: string;
    event: Pick<Event, 'title'>;
  }>;
}

export interface PlaceWithQuestion extends Place {
  questionId?: string | null;
  question?: AdminQuestion | null;
}

export interface AdminEvent extends Event {
  places: PlaceWithQuestion[];
  eventQuestions: EventQuestionLink[];
  _count?: { places: number; eventQuestions: number };
}

export interface UserEventProgress {
  id: string;
  userId: string;
  eventId: string;
  currentPlaceIndex: number;
  completed: boolean;
  score: number;
  startedAt: string;
  completedAt: string | null;
  totalDurationMs?: number | null;
  finishRank?: number | null;
  giftCodeAwarded?: string | null;
}

/** Payload for EventCompletionScreen / GET /events/:id/completion */
export interface EventCompletionPayload {
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

export interface EventFinisher {
  userId: string;
  userName: string;
  completedAt: string;
  totalDurationMs: number | null;
  score: number;
  finishRank: number | null;
  giftCodeAwarded: string | null;
}

export interface EventFinishersResponse {
  event: { id: string; title: string; city: string };
  giftCount: number;
  giftAssignedCount: number;
  finishers: EventFinisher[];
}

export interface UserPlaceCompletion {
  id: string;
  userId: string;
  placeId: string;
  completed: boolean;
  answer: string | null;
  unlockedAt?: string | null;
  completedAt: string | null;
  answerDurationMs?: number | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AnalyticsOverview {
  totalUsers: number;
  activeUsers: number;
  totalEvents: number;
  completedEvents: number;
  completionRate: number;
}

export interface EventAnalytics {
  eventId: string;
  eventTitle: string;
  participants: number;
  completions: number;
  completionRate: number;
  averageScore: number;
}

export interface UnlockPlaceRequest {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface AnswerPlaceRequest {
  answer: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface LocationWarning {
  code: string;
  message: string;
}

export interface AnswerPlaceResponse {
  correct: boolean;
  points: number;
  totalScore: number;
  explanation: string | null;
  nextPlaceId: string | null;
  eventCompleted: boolean;
  answerDurationMs?: number | null;
  eventTotalDurationMs?: number | null;
  warnings?: LocationWarning[];
  alreadyCompleted?: boolean;
  finishRank?: number | null;
  completionMessage?: string | null;
  giftTeaser?: string | null;
  giftCode?: string | null;
  giftCount?: number;
  giftsAllClaimed?: boolean;
}

export interface EventLeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  score: number;
  totalDurationMs: number;
  completedAt: string;
}

export interface EventLeaderboardResponse {
  event: { id: string; title: string; city: string };
  entries: EventLeaderboardEntry[];
}

export interface GlobalLeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  totalScore: number;
  eventsCompleted: number;
  avgDurationMs: number | null;
}

export interface GlobalLeaderboardResponse {
  entries: GlobalLeaderboardEntry[];
}

export type EventParticipantSortBy =
  | 'fastest'
  | 'slowest'
  | 'score'
  | 'started'
  | 'name';

export interface EventParticipant {
  userId: string;
  userName: string;
  userEmail: string;
  score: number;
  completed: boolean;
  currentPlaceIndex: number;
  placesCompleted: number;
  totalPlaces: number;
  startedAt: string;
  completedAt: string | null;
  totalDurationMs: number | null;
  finishRank: number | null;
  giftCodeAwarded: string | null;
}

export interface EventParticipantsResponse {
  event: {
    id: string;
    title: string;
    city: string;
    giftCount: number;
    giftAssignedCount: number;
  };
  participants: PaginatedResponse<EventParticipant>;
}

export interface AnticheatUserListItem {
  id: string;
  email: string;
  name: string;
  warningPoints: number;
  playSuspendedUntil: string | null;
  isActive: boolean;
  createdAt: string;
  lastWarningAt: string | null;
  lastWarningCode: string | null;
  totalWarnings: number;
}

export type SuspendDuration = '1d' | '2d' | '1w' | '1m';

export interface NearbyEventsQuery {
  latitude: number;
  longitude: number;
  radiusKm?: number;
}

export interface CreateEventDto {
  title: string;
  description: string;
  city: string;
  coverImage?: string;
  difficulty: EventDifficulty;
  rewardPoints: number;
  isActive?: boolean;
  completionMessage?: string | null;
  giftTeaser?: string | null;
  giftCodes?: string[];
}

export interface UpdateEventDto extends Partial<CreateEventDto> {}

export interface CreatePlaceDto {
  eventId: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  orderIndex: number;
  hint?: string;
}

export interface UpdatePlaceDto extends Partial<
  Omit<CreatePlaceDto, 'eventId'>
> {
  questionId?: string | null;
}

export enum QuestionSource {
  COMMUNITY = 'COMMUNITY',
  EVENT = 'EVENT',
}

export type PracticeQuestionStatus = 'unfinished' | 'completed';

export interface PracticeQuestionListItem {
  id: string;
  text: string;
  type: QuestionType;
  imageUrl?: string | null;
  options?: string[] | null;
  points: number;
  authorId: string;
  authorName: string;
  source: 'community' | 'event';
  eventId?: string;
  eventTitle?: string;
  isPublished: boolean;
  createdAt: string;
  isFavorite: boolean;
  isTrainingCompleted: boolean;
}

export interface PracticeQuestionAdminItem extends AdminQuestion {
  source: QuestionSource;
  isPublished: boolean;
  createdBy: string | null;
  creator?: Pick<User, 'id' | 'name' | 'email'> | null;
  completionCount?: number;
  favoriteCount?: number;
}

export interface PracticeStats {
  totalCommunityQuestions: number;
  publishedCommunityQuestions: number;
  completionsLast7Days: number;
  completionsLast30Days: number;
  topPracticed: Array<{ questionId: string; text: string; count: number }>;
}

export interface TrainingAnswerResponse {
  isCorrect: boolean;
  message: string;
  explanation?: string | null;
}

export interface CreateQuestionDto {
  question: string;
  type: QuestionType;
  imageUrl?: string;
  options?: string[];
  answer: string;
  explanation?: string;
  points?: number;
}

export interface UpdateQuestionDto extends Partial<CreateQuestionDto> {}

export interface LinkQuestionToEventDto {
  questionId: string;
  orderIndex?: number;
}

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

export enum FeedbackStatus {
  NEW = 'NEW',
  READ = 'READ',
  RESOLVED = 'RESOLVED',
  ARCHIVED = 'ARCHIVED',
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
  status: FeedbackStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'name' | 'email'> | null;
}

export interface SubmitFeedbackDto {
  name?: string;
  email?: string;
  category: FeedbackCategory;
  subject?: string;
  message: string;
  source: FeedbackSource;
}

export interface UpdateFeedbackDto {
  status?: FeedbackStatus;
  adminNote?: string | null;
}

export enum ArticleStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

/** Full article as seen by Admin/Staff in the dashboard. */
export interface Article {
  id: string;
  title: string;
  slug: string;
  placeName: string;
  city: string | null;
  excerpt: string;
  body: string;
  coverImage: string | null;
  status: ArticleStatus;
  publishedAt: string | null;
  eventId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: Pick<User, 'id' | 'name' | 'email'> | null;
  event?: Pick<Event, 'id' | 'title' | 'city' | 'isActive'> | null;
}

/** Public-facing article shape returned to the marketing site (no internal fields). */
export interface PublicArticle {
  id: string;
  title: string;
  slug: string;
  placeName: string;
  city: string | null;
  excerpt: string;
  body: string;
  coverImage: string | null;
  publishedAt: string | null;
  event?: Pick<Event, 'id' | 'title' | 'city'> | null;
}

export interface CreateArticleDto {
  title: string;
  slug?: string;
  placeName: string;
  city?: string;
  excerpt: string;
  body: string;
  coverImage?: string;
  status?: ArticleStatus;
  eventId?: string | null;
}

export interface UpdateArticleDto extends Partial<CreateArticleDto> {}

export interface WebSocketEvents {
  event_progress_updated: {
    userId: string;
    eventId: string;
    currentPlaceIndex: number;
    score: number;
  };
  place_unlocked: {
    userId: string;
    placeId: string;
    eventId: string;
  };
  event_completed: {
    userId: string;
    eventId: string;
    score: number;
    finishRank?: number | null;
    giftCode?: string | null;
    giftCount?: number;
    giftsAllClaimed?: boolean;
  };
  admin_live_analytics: AnalyticsOverview;
}
