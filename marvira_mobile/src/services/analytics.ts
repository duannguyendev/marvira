/**
 * Central analytics + Crashlytics helper (see requirement_all.txt §24).
 * Fail-soft: never throw into UX. No PII / precise GPS in params.
 */
import { AppState, type AppStateStatus } from 'react-native';

export type AnalyticsParams = Record<
  string,
  string | number | boolean | null | undefined
>;

/** Set true temporarily to send events from debug builds to Firebase DebugView. */
const FORCE_ANALYTICS_IN_DEV = false;

const COLLECTION_ENABLED = !__DEV__ || FORCE_ANALYTICS_IN_DEV;

type AnalyticsModule = {
  (): {
    logEvent: (name: string, params?: Record<string, unknown>) => Promise<void>;
    logScreenView: (params: {
      screen_name: string;
      screen_class?: string;
    }) => Promise<void>;
    setUserId: (id: string | null) => Promise<void>;
    setAnalyticsCollectionEnabled: (enabled: boolean) => Promise<void>;
  };
};

type CrashlyticsModule = {
  (): {
    log: (message: string) => void;
    recordError: (error: Error) => void;
    setUserId: (id: string) => Promise<void>;
    setCrashlyticsCollectionEnabled: (enabled: boolean) => Promise<void>;
  };
};

function getAnalytics(): ReturnType<AnalyticsModule> | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@react-native-firebase/analytics') as AnalyticsModule;
    return mod();
  } catch {
    return null;
  }
}

function getCrashlytics(): ReturnType<CrashlyticsModule> | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod =
      require('@react-native-firebase/crashlytics') as CrashlyticsModule;
    return mod();
  } catch {
    return null;
  }
}

function sanitizeParams(
  params?: AnalyticsParams,
): Record<string, string | number> | undefined {
  if (!params) {
    return undefined;
  }
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      continue;
    }
    if (typeof value === 'boolean') {
      out[key] = value ? 1 : 0;
    } else {
      out[key] = value;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

let initialized = false;
let appStateSubscription: { remove: () => void } | null = null;

async function ensureInitialized(): Promise<void> {
  if (initialized) {
    return;
  }
  initialized = true;
  const analytics = getAnalytics();
  const crashlytics = getCrashlytics();
  try {
    await analytics?.setAnalyticsCollectionEnabled(COLLECTION_ENABLED);
    await crashlytics?.setCrashlyticsCollectionEnabled(COLLECTION_ENABLED);
  } catch {
    // ignore
  }
}

export const analytics = {
  async init(): Promise<void> {
    await ensureInitialized();
  },

  /** Call once from App root — app_open + foreground reopen. */
  startAppOpenTracking(): () => void {
    void this.init().then(() => this.logEvent('app_open'));

    const onChange = (state: AppStateStatus) => {
      if (state === 'active') {
        void this.logEvent('app_open');
      }
    };
    appStateSubscription?.remove();
    appStateSubscription = AppState.addEventListener('change', onChange);
    return () => {
      appStateSubscription?.remove();
      appStateSubscription = null;
    };
  },

  async setUserId(userId: string | null): Promise<void> {
    await ensureInitialized();
    try {
      const analyticsMod = getAnalytics();
      const crashlytics = getCrashlytics();
      await analyticsMod?.setUserId(userId);
      if (userId) {
        await crashlytics?.setUserId(userId);
      } else {
        await crashlytics?.setUserId('');
      }
    } catch {
      // ignore
    }
  },

  async logEvent(name: string, params?: AnalyticsParams): Promise<void> {
    if (!COLLECTION_ENABLED) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.debug('[analytics]', name, sanitizeParams(params) ?? {});
      }
      return;
    }
    await ensureInitialized();
    try {
      await getAnalytics()?.logEvent(name, sanitizeParams(params));
    } catch {
      // ignore
    }
  },

  async logScreenView(screenName: string): Promise<void> {
    if (!COLLECTION_ENABLED) {
      return;
    }
    await ensureInitialized();
    try {
      await getAnalytics()?.logScreenView({
        screen_name: screenName,
        screen_class: screenName,
      });
    } catch {
      // ignore
    }
  },

  logBreadcrumb(message: string): void {
    try {
      getCrashlytics()?.log(message);
    } catch {
      // ignore
    }
  },

  recordError(error: unknown): void {
    try {
      const err =
        error instanceof Error ? error : new Error(String(error ?? 'Unknown'));
      getCrashlytics()?.recordError(err);
    } catch {
      // ignore
    }
  },
};

/** Typed helpers matching requirement_all.txt §24 taxonomy. */
export const AnalyticsEvents = {
  huntStarted: (eventId: string) =>
    analytics.logEvent('hunt_started', { event_id: eventId }),

  placeUnlocked: (eventId: string, placeId: string) =>
    analytics.logEvent('place_unlocked', {
      event_id: eventId,
      place_id: placeId,
    }),

  placeAnswered: (eventId: string, placeId: string, correct: boolean) =>
    analytics.logEvent('place_answered', {
      event_id: eventId,
      place_id: placeId,
      correct: correct ? 1 : 0,
    }),

  huntCompleted: (
    eventId: string,
    opts?: { score?: number; duration_sec?: number },
  ) =>
    analytics.logEvent('hunt_completed', {
      event_id: eventId,
      score: opts?.score,
      duration_sec: opts?.duration_sec,
    }),

  huntAbandoned: (eventId: string, placesDone?: number) =>
    analytics.logEvent('hunt_abandoned', {
      event_id: eventId,
      places_done: placesDone,
    }),

  practiceOpened: (source: 'list' | 'training') =>
    analytics.logEvent('practice_opened', { source }),

  practiceAnswered: (questionId: string, correct: boolean) =>
    analytics.logEvent('practice_answered', {
      question_id: questionId,
      correct: correct ? 1 : 0,
    }),

  eventDraftCreated: (eventId: string) =>
    analytics.logEvent('event_draft_created', { event_id: eventId }),

  eventPublished: (eventId: string) =>
    analytics.logEvent('event_published', { event_id: eventId }),

  eventUnpublished: (eventId: string) =>
    analytics.logEvent('event_unpublished', { event_id: eventId }),

  inviteOpened: (
    eventId: string | undefined,
    linkType: 'invite' | 'share' | 'other',
  ) =>
    analytics.logEvent('invite_opened', {
      event_id: eventId,
      link_type: linkType,
    }),

  shareTapped: (
    eventId: string,
    surface: 'post_hunt' | 'event_detail' | 'other',
  ) =>
    analytics.logEvent('share_tapped', {
      event_id: eventId,
      surface,
    }),

  feedbackSubmitted: (category?: string) =>
    analytics.logEvent('feedback_submitted', {
      category: category ?? undefined,
    }),

  notificationInboxOpened: () =>
    analytics.logEvent('notification_inbox_opened'),

  notificationReceived: (type?: string) =>
    analytics.logEvent('notification_received', {
      notification_type: type ?? undefined,
    }),

  notificationOpened: (type?: string, notificationId?: string) =>
    analytics.logEvent('notification_opened', {
      notification_type: type ?? undefined,
      notification_id: notificationId ?? undefined,
    }),
};
