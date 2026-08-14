import { Platform, PermissionsAndroid } from 'react-native';
import i18n from '../i18n';
import { notificationsApi } from '../api/notifications';
import { storage } from '../utils/storage';

const TOKEN_STORAGE_KEY = 'fcm_device_token';
const TOKEN_ENV_KEY = 'fcm_apns_env';

type MessagingInstance = {
  requestPermission: () => Promise<number>;
  getToken: () => Promise<string>;
  deleteToken?: () => Promise<void>;
  onTokenRefresh: (cb: (token: string) => void) => () => void;
  onMessage: (cb: (msg: unknown) => void) => () => void;
  onNotificationOpenedApp: (cb: (msg: unknown) => void) => () => void;
  getInitialNotification: () => Promise<unknown>;
};

type MessagingModule = {
  default: () => MessagingInstance;
  AuthorizationStatus: {
    NOT_DETERMINED: number;
    DENIED: number;
    AUTHORIZED: number;
    PROVISIONAL: number;
  };
};

function getMessaging(): MessagingModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@react-native-firebase/messaging') as MessagingModule;
  } catch {
    return null;
  }
}

function currentApnsEnv(): string {
  if (Platform.OS !== 'ios') return 'android';
  return __DEV__ ? 'sandbox' : 'prod';
}

async function ensureAndroidPermission(): Promise<boolean> {
  if (Platform.OS !== 'android' || Platform.Version < 33) {
    return true;
  }
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

async function requestPermission(): Promise<boolean> {
  const mod = getMessaging();
  if (!mod) return false;

  if (Platform.OS === 'android') {
    return ensureAndroidPermission();
  }

  const authStatus = await mod.default().requestPermission();
  return (
    authStatus === mod.AuthorizationStatus.AUTHORIZED ||
    authStatus === mod.AuthorizationStatus.PROVISIONAL
  );
}

/**
 * Debug iOS uses APNs sandbox; Release uses production. A cached FCM token from
 * the other environment is accepted by Firebase Console but never delivered.
 */
async function refreshTokenIfApnsEnvChanged(
  messaging: MessagingInstance,
): Promise<void> {
  const env = currentApnsEnv();
  const last = await storage.getItem(TOKEN_ENV_KEY);
  if (last === env) return;
  try {
    await messaging.deleteToken?.();
  } catch {
    // best-effort — getToken below still runs
  }
  await storage.removeItem(TOKEN_STORAGE_KEY);
  await storage.setItem(TOKEN_ENV_KEY, env);
}

async function registerTokenWithApi(fcmToken: string): Promise<void> {
  await notificationsApi.registerDevice({
    fcmToken,
    platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
    locale: (i18n.language || 'en').slice(0, 2),
  });
  await storage.setItem(TOKEN_STORAGE_KEY, fcmToken);
  await storage.setItem(TOKEN_ENV_KEY, currentApnsEnv());
}

export const pushNotifications = {
  async registerIfAuthenticated(): Promise<string | null> {
    const token = await storage.getToken();
    if (!token) return null;

    const mod = getMessaging();
    if (!mod) return null;

    const allowed = await requestPermission();
    if (!allowed) return null;

    try {
      const messaging = mod.default();
      await refreshTokenIfApnsEnvChanged(messaging);
      const fcmToken = await messaging.getToken();
      if (!fcmToken) return null;

      await registerTokenWithApi(fcmToken);
      return fcmToken;
    } catch (err) {
      console.warn('FCM register failed', err);
      return null;
    }
  },

  async unregister(): Promise<void> {
    const fcmToken = await storage.getItem(TOKEN_STORAGE_KEY);
    if (!fcmToken) return;
    try {
      await notificationsApi.unregisterDevice(fcmToken);
    } catch {
      // best-effort
    } finally {
      await storage.removeItem(TOKEN_STORAGE_KEY);
    }
  },

  subscribeTokenRefresh(onRefresh?: (token: string) => void): () => void {
    const mod = getMessaging();
    if (!mod) return () => undefined;
    return mod.default().onTokenRefresh(async token => {
      try {
        const auth = await storage.getToken();
        if (!auth) return;
        await registerTokenWithApi(token);
        onRefresh?.(token);
      } catch (err) {
        console.warn('FCM token refresh register failed', err);
      }
    });
  },

  onForegroundMessage(handler: (msg: unknown) => void): () => void {
    const mod = getMessaging();
    if (!mod) return () => undefined;
    return mod.default().onMessage(handler);
  },

  onNotificationOpened(handler: (msg: unknown) => void): () => void {
    const mod = getMessaging();
    if (!mod) return () => undefined;
    return mod.default().onNotificationOpenedApp(handler);
  },

  async getInitialNotification(): Promise<unknown> {
    const mod = getMessaging();
    if (!mod) return null;
    return mod.default().getInitialNotification();
  },
};
