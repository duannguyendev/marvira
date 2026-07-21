export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: {token?: string} | undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  Feedback: undefined;
  MyEvents: undefined;
  MyQuestions: undefined;
  AddQuestion: {questionId?: string} | undefined;
};

export type PracticeStackParamList = {
  PracticeList: undefined;
  QuestionTraining: {questionId: string};
  AddQuestion: {questionId?: string} | undefined;
};

export type FavoritesStackParamList = {
  FavoritesList: undefined;
  QuestionTraining: {questionId: string};
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

export type HomeStackParamList = {
  EventsList: undefined;
  EventDetails: {eventId: string};
  PlaceGame: {eventId: string; placeId: string};
  EventCompletion: {eventId: string; score?: number; totalDurationMs?: number | null};
  EventLeaderboard: {eventId: string};
  GlobalLeaderboard: undefined;
  CreateEventInfo: undefined;
  CreateEventPlace: {eventId: string; placeIndex: number};
  CreateEventReview: {eventId: string};
  CreateEventSuccess: {eventId: string; published: boolean; joinPassword?: string};
};
