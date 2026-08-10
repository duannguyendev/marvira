type LogoutListener = () => void;

const listeners = new Set<LogoutListener>();

export const authSession = {
  subscribe(listener: LogoutListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  notifyLogout(): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { authService } = require('./auth.service') as typeof import('./auth.service');
      authService.clearLocalSession();
    } catch {
      // ignore
    }
    // Clear analytics user id without awaiting (forced logout path)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { analytics } = require('./analytics') as typeof import('./analytics');
      void analytics.setUserId(null);
    } catch {
      // ignore
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { pushNotifications } = require('./pushNotifications') as typeof import('./pushNotifications');
      void pushNotifications.unregister();
    } catch {
      // ignore
    }
    listeners.forEach(listener => listener());
  },
};
