import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isDashboardRole, type User } from '@marvira/shared-types';
import { api } from '@/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const data = await api.post<{ user: User; tokens: { accessToken: string; refreshToken: string } }>(
          '/auth/login',
          { email, password },
        );
        if (!isDashboardRole(data.user.role)) {
          api.clearTokens();
          throw new Error('Staff or admin access only. This account cannot use the dashboard.');
        }
        api.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
        set({ user: data.user, isAuthenticated: true });
      },

      logout: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            await api.post('/auth/logout', { refreshToken });
          } catch {
            /* ignore */
          }
        }
        api.clearTokens();
        set({ user: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        try {
          const user = await api.get<User>('/auth/me');
          set({ user, isAuthenticated: true });
        } catch {
          set({ user: null, isAuthenticated: false });
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
