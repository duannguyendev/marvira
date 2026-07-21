type LogoutListener = () => void;

const listeners = new Set<LogoutListener>();

export const authSession = {
  subscribe(listener: LogoutListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  notifyLogout(): void {
    listeners.forEach(listener => listener());
  },
};
