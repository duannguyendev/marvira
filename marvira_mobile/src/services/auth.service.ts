import {storage} from '../utils/storage';
import {authApi} from '../api/auth';
import {User, LoginCredentials, RegisterCredentials} from '../types';

class AuthService {
  private currentUser: User | null = null;

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await authApi.login(credentials);
      if (response.success && response.data) {
        await storage.setToken(response.data.token);
        if (response.data.refreshToken) {
          await storage.setRefreshToken(response.data.refreshToken);
        }
        await storage.setUser(response.data.user);
        this.currentUser = response.data.user;
        return response.data.user;
      }
      throw new Error(response.message || 'Login failed');
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
      if (response.success && response.data) {
        await storage.setToken(response.data.token);
        if (response.data.refreshToken) {
          await storage.setRefreshToken(response.data.refreshToken);
        }
        await storage.setUser(response.data.user);
        this.currentUser = response.data.user;
        return response.data.user;
      }
      throw new Error(response.message || 'Registration failed');
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await authApi.logout();
    } catch (error) {
      // Continue with local logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      await storage.clearAll();
      this.currentUser = null;
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
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }
    const user = await storage.getUser();
    if (user) {
      this.currentUser = user;
    }
    return user;
  }

  /**
   * Get auth token
   */
  async getToken(): Promise<string | null> {
    return storage.getToken();
  }

  /**
   * Refresh auth token
   */
  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      const response = await authApi.refreshToken(refreshToken);
      await storage.setToken(response.token);
      if (response.refreshToken) {
        await storage.setRefreshToken(response.refreshToken);
      }
      return response.token;
    } catch (error) {
      await this.logout();
      return null;
    }
  }
}

export const authService = new AuthService();

