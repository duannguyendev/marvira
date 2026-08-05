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
  Notifications: undefined;
  NotificationDetail: { notificationId: string };
  MyEvents: undefined;
  MyQuestions: undefined;
  AddQuestion: { questionId?: string } | undefined;
};

export type PracticeStackParamList = {
  PracticeList: undefined;
  QuestionTraining: { questionId: string };
  AddQuestion: { questionId?: string } | undefined;
};

export type FavoritesStackParamList = {
  FavoritesList: undefined;
  QuestionTraining: { questionId: string };
};

export type MainTabParamList = {
  Home:
    | undefined
    | {
        screen: keyof HomeStackParamList;
        params?: HomeStackParamList[keyof HomeStackParamList];
      };
  Practice:
    | undefined
    | {
        screen: keyof PracticeStackParamList;
        params?: PracticeStackParamList[keyof PracticeStackParamList];
      };
  Favorites:
    | undefined
    | {
        screen: keyof FavoritesStackParamList;
        params?: FavoritesStackParamList[keyof FavoritesStackParamList];
      };
  Profile:
    | undefined
    | {
        screen: keyof ProfileStackParamList;
        params?: ProfileStackParamList[keyof ProfileStackParamList];
      };
};

export type RootStackParamList = {
  Auth: undefined;
  Main:
    | undefined
    | {
        screen: keyof MainTabParamList;
        params?: MainTabParamList[keyof MainTabParamList];
      };
};

export type HomeStackParamList = {
  EventsList: undefined;
  EventDetails: { eventId: string };
  PlaceGame: { eventId: string; placeId: string };
  EventCompletion: {
    eventId: string;
    score?: number;
    totalDurationMs?: number | null;
    finishRank?: number | null;
    completionMessage?: string | null;
    giftTeaser?: string | null;
    giftCode?: string | null;
    giftCount?: number;
    giftsAllClaimed?: boolean;
  };
  EventLeaderboard: { eventId: string };
  EventFinishers: { eventId: string };
  GlobalLeaderboard: undefined;
  CreateEventInfo: undefined;
  CreateEventPlace: { eventId: string; placeIndex: number };
  CreateEventReview: { eventId: string; verifyComplete?: boolean; returnAction?: 'publish' };
  AnswerVerify: { eventId: string; returnAction?: 'publish' };
  CreateEventSuccess: {
    eventId: string;
    published: boolean;
    scheduled?: boolean;
    scheduledPublishAt?: string;
    joinPassword?: string;
  };
  EditEventGifts: { eventId: string };
  EditEventAnswers: { eventId: string; returnToVerify?: boolean };
};
