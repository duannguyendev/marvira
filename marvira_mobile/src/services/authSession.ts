type LogoutListener = () => void;

const listeners = new Set<LogoutListener>();

export const authSession = {
  subscribe(listener: LogoutListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  notifyLogout(): void {
    // Clear analytics user id without awaiting (forced logout path)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { analytics } = require('./analytics') as typeof import('./analytics');
      void analytics.setUserId(null);
    } catch {
      // ignore
    }
    listeners.forEach(listener => listener());
  },
};
