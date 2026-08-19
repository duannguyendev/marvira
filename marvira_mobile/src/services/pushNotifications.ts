import { Platform, PermissionsAndroid } from 'react-native';
import i18n from '../i18n';
import { notificationsApi } from '../api/notifications';
import { storage } from '../utils/storage';

const TOKEN_STORAGE_KEY = 'fcm_device_token';
const TOKEN_ENV_KEY = 'fcm_apns_env';

type MessagingInstance = {
  requestPermission: () => Promise<number>;
  hasPermission?: () => Promise<number>;
  registerDeviceForRemoteMessages: () => Promise<void>;
  getAPNSToken?: () => Promise<string | null>;
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

export type PushDiagnostics = {
  permissionGranted: boolean;
  apnsToken: string | null;
  fcmToken: string | null;
  apnsEnv: string;
  storedLocally: boolean;
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
  return __DEV__ ? 'sandbox' : 'production';
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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

async function hasPermission(): Promise<boolean> {
  const mod = getMessaging();
  if (!mod) return false;

  if (Platform.OS === 'android') {
    if (Platform.Version < 33) return true;
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return granted;
  }

  if (!mod.default().hasPermission) return false;
  const authStatus = await mod.default().hasPermission!();
  return (
    authStatus === mod.AuthorizationStatus.AUTHORIZED ||
    authStatus === mod.AuthorizationStatus.PROVISIONAL
  );
}

/**
 * iOS must link an APNs device token before FCM can deliver tray notifications.
 * getToken() alone can return a value that Firebase accepts but Apple never shows.
 */
async function ensureIosApnsLinked(
  messaging: MessagingInstance,
): Promise<string | null> {
  await messaging.registerDeviceForRemoteMessages();

  if (!messaging.getAPNSToken) {
    return null;
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const apnsToken = await messaging.getAPNSToken();
    if (apnsToken) {
      return apnsToken;
    }
    await sleep(500);
  }

  return null;
}

async function refreshTokenIfApnsEnvChanged(
  messaging: MessagingInstance,
): Promise<void> {
  const env = currentApnsEnv();
  const last = await storage.getItem(TOKEN_ENV_KEY);
  if (last === env) return;
  try {
    await messaging.deleteToken?.();
  } catch {
    // best-effort
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

async function obtainFcmToken(messaging: MessagingInstance): Promise<string | null> {
  if (Platform.OS === 'ios') {
    const apnsToken = await ensureIosApnsLinked(messaging);
    if (!apnsToken) {
      console.warn(
        'FCM register skipped: APNs token not available (push will not deliver on iOS)',
      );
      return null;
    }
  }

  await refreshTokenIfApnsEnvChanged(messaging);
  const fcmToken = await messaging.getToken();
  return fcmToken || null;
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
      const fcmToken = await obtainFcmToken(messaging);
      if (!fcmToken) return null;

      await registerTokenWithApi(fcmToken);
      return fcmToken;
    } catch (err) {
      console.warn('FCM register failed', err);
      return null;
    }
  },

  async getDiagnostics(): Promise<PushDiagnostics | null> {
    const mod = getMessaging();
    if (!mod) return null;

    const messaging = mod.default();
    const permissionGranted = await hasPermission();
    let apnsToken: string | null = null;
    let fcmToken: string | null = null;

    if (Platform.OS === 'ios' && permissionGranted) {
      try {
        await messaging.registerDeviceForRemoteMessages();
        apnsToken = (await messaging.getAPNSToken?.()) ?? null;
      } catch {
        apnsToken = null;
      }
    }

    if (permissionGranted) {
      try {
        if (Platform.OS !== 'ios' || apnsToken) {
          fcmToken = await messaging.getToken();
        }
      } catch {
        fcmToken = null;
      }
    }

    const stored = await storage.getItem(TOKEN_STORAGE_KEY);

    return {
      permissionGranted,
      apnsToken,
      fcmToken: fcmToken ?? stored,
      apnsEnv: currentApnsEnv(),
      storedLocally: !!stored,
    };
  },

  async unregister(): Promise<void> {
    const fcmToken = await storage.getItem(TOKEN_STORAGE_KEY);
    if (fcmToken) {
      try {
        await notificationsApi.unregisterDevice(fcmToken);
      } catch {
        // best-effort
      }
    }
    await storage.removeItem(TOKEN_STORAGE_KEY);
    await storage.removeItem(TOKEN_ENV_KEY);
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
