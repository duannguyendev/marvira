import { storage } from '../utils/storage';
import { authApi } from '../api/auth';
import { User, LoginCredentials, RegisterCredentials } from '../types';
import { analytics } from './analytics';
import { pushNotifications } from './pushNotifications';

class AuthService {
  private currentUser: User | null = null;

  /**
   * Persist session from an auth API response
   */
  private async persistAuth(response: {
    success: boolean;
    data?: {
      token: string;
      refreshToken?: string;
      user: User;
    };
    message?: string;
  }): Promise<User> {
    if (response.success && response.data) {
      await storage.setToken(response.data.token);
      if (response.data.refreshToken) {
        await storage.setRefreshToken(response.data.refreshToken);
      }
      await storage.setUser(response.data.user);
      this.currentUser = response.data.user;
      await analytics.setUserId(response.data.user.id);
      void pushNotifications.registerIfAuthenticated();
      return response.data.user;
    }
    throw new Error(response.message || 'Login failed');
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await authApi.login(credentials);
      return this.persistAuth(response);
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Register user
   */
  async register(credentials: RegisterCredentials): Promise<User> {
    try {
      const response = await authApi.register(credentials);
      return this.persistAuth(response);
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  }

  async loginWithGoogle(idToken: string): Promise<User> {
    try {
      const response = await authApi.loginWithGoogle(idToken);
      return this.persistAuth(response);
    } catch (error: any) {
      throw new Error(error.message || 'Google sign-in failed');
    }
  }

  async loginWithApple(identityToken: string, name?: string): Promise<User> {
    try {
      const response = await authApi.loginWithApple(identityToken, name);
      return this.persistAuth(response);
    } catch (error: any) {
      throw new Error(error.message || 'Apple sign-in failed');
    }
  }

  async loginWithFacebook(accessToken: string): Promise<User> {
    try {
      const response = await authApi.loginWithFacebook(accessToken);
      return this.persistAuth(response);
    } catch (error: any) {
      throw new Error(error.message || 'Facebook sign-in failed');
    }
  }

  /**
   * Clear in-memory session only (forced logout already cleared storage)
   */
  clearLocalSession(): void {
    this.currentUser = null;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await pushNotifications.unregister();
    } catch {
      // continue
    }
    try {
      await authApi.logout();
    } catch (error) {
      // Continue with local logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      await storage.clearAll();
      this.currentUser = null;
      await analytics.setUserId(null);
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await storage.getToken();
    return !!token;
  }

  /**
   * Get current user — prefer /auth/me so fields like provider stay fresh
   */
  async getCurrentUser(): Promise<User | null> {
    const token = await storage.getToken();
    if (!token) {
      this.currentUser = null;
      return null;
    }

    try {
      const response = await authApi.getCurrentUser();
      if (response.success && response.data) {
        await storage.setUser(response.data);
        this.currentUser = response.data;
        await analytics.setUserId(response.data.id);
        return response.data;
      }
    } catch {
      // Session may have been cleared by the 401 interceptor during this call
      const stillAuthed = await storage.getToken();
      if (!stillAuthed) {
        this.currentUser = null;
        return null;
      }
      // Offline / transient — fall back to cached user
    }

    if (this.currentUser) {
      return this.currentUser;
    }
    const user = await storage.getUser();
    if (user) {
      this.currentUser = user;
      await analytics.setUserId(user.id);
    }
    return user;
  }

  /**
   * Update cached user after profile/password changes (stay signed in)
   */
  async applyUserUpdate(user: User): Promise<void> {
    await storage.setUser(user);
    this.currentUser = user;
  }

  /**
   * Get auth token
   */
  async getToken(): Promise<string | null> {
    return storage.getToken();
  }

  /**
   * Refresh auth token. Network errors leave the local session intact;
   * only an invalid/expired refresh token clears credentials.
   */
  async refreshToken(): Promise<string | null> {
    const refreshToken = await storage.getRefreshToken();
    if (!refreshToken) {
      await storage.clearAll();
      this.currentUser = null;
      return null;
    }

    try {
      const response = await authApi.refreshToken(refreshToken);
      await storage.setToken(response.token);
      if (response.refreshToken) {
        await storage.setRefreshToken(response.refreshToken);
      }
      return response.token;
    } catch (error: any) {
      const status = error?.status ?? error?.response?.status;
      if (status === 401 || status === 403) {
        await this.logout();
      }
      return null;
    }
  }
}

export const authService = new AuthService();
