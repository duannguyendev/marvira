import { Platform, PermissionsAndroid } from 'react-native';
import i18n from '../i18n';
import { notificationsApi } from '../api/notifications';
import { storage } from '../utils/storage';

const TOKEN_STORAGE_KEY = 'fcm_device_token';

type MessagingModule = {
  default: () => {
    requestPermission: () => Promise<number>;
    getToken: () => Promise<string>;
    onTokenRefresh: (cb: (token: string) => void) => () => void;
    onMessage: (cb: (msg: unknown) => void) => () => void;
    onNotificationOpenedApp: (cb: (msg: unknown) => void) => () => void;
    getInitialNotification: () => Promise<unknown>;
    setBackgroundMessageHandler?: (cb: (msg: unknown) => Promise<void>) => void;
    hasPermission?: () => Promise<number>;
  };
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

  const androidOk = await ensureAndroidPermission();
  if (!androidOk) return false;

  const authStatus = await mod.default().requestPermission();
  return (
    authStatus === mod.AuthorizationStatus.AUTHORIZED ||
    authStatus === mod.AuthorizationStatus.PROVISIONAL
  );
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
      const fcmToken = await mod.default().getToken();
      if (!fcmToken) return null;

      await notificationsApi.registerDevice({
        fcmToken,
        platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
        locale: (i18n.language || 'en').slice(0, 2),
      });
      await storage.setItem(TOKEN_STORAGE_KEY, fcmToken);
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
        await notificationsApi.registerDevice({
          fcmToken: token,
          platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
          locale: (i18n.language || 'en').slice(0, 2),
        });
        await storage.setItem(TOKEN_STORAGE_KEY, token);
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
