import {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  ApiResponse,
  User,
} from '../types';
import {USE_MOCK_DATA} from '../utils/constants';
import {mockUser, delay} from './mockData';
import {apiClient} from './client';
import {ApiLoginData, ApiUser} from '../types/api';
import {storage} from '../utils/storage';

function mapApiUser(user: ApiUser): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };
}

function mapAuthData(data: ApiLoginData): AuthResponse {
  return {
    user: mapApiUser(data.user),
    token: data.tokens.accessToken,
    refreshToken: data.tokens.refreshToken,
  };
}

export const authApi = {
  login: async (
    credentials: LoginCredentials,
  ): Promise<ApiResponse<AuthResponse>> => {
    if (USE_MOCK_DATA) {
      await delay(800);
      return {
        success: true,
        data: {
          token: 'mock_jwt_token_' + Date.now(),
          refreshToken: 'mock_refresh_token_' + Date.now(),
          user: {
            ...mockUser,
            email: credentials.email,
            name: credentials.email.split('@')[0],
          },
        },
      };
    }

    const response = await apiClient.post<{success: boolean; data: ApiLoginData}>(
      '/auth/login',
      credentials,
    );
    return {success: true, data: mapAuthData(response.data.data)};
  },

  register: async (
    credentials: RegisterCredentials,
  ): Promise<ApiResponse<AuthResponse>> => {
    if (USE_MOCK_DATA) {
      await delay(800);
      return {
        success: true,
        data: {
          token: 'mock_jwt_token_' + Date.now(),
          refreshToken: 'mock_refresh_token_' + Date.now(),
          user: {
            id: 'mock_' + Date.now(),
            email: credentials.email,
            name: credentials.name,
            createdAt: new Date().toISOString(),
          },
        },
      };
    }

    const response = await apiClient.post<{success: boolean; data: ApiLoginData}>(
      '/auth/register',
      credentials,
    );
    return {success: true, data: mapAuthData(response.data.data)};
  },

  logout: async (): Promise<void> => {
    if (USE_MOCK_DATA) {
      await delay(300);
      return;
    }
    const refreshToken = await storage.getRefreshToken();
    if (refreshToken) {
      await apiClient.post('/auth/logout', {refreshToken});
    }
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    if (USE_MOCK_DATA) {
      await delay(300);
      return {
        token: 'mock_jwt_token_' + Date.now(),
        refreshToken: 'mock_refresh_token_' + Date.now(),
        user: mockUser,
      };
    }

    const response = await apiClient.post<{success: boolean; data: ApiLoginData}>(
      '/auth/refresh',
      {refreshToken},
    );
    return mapAuthData(response.data.data);
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    if (USE_MOCK_DATA) {
      await delay(300);
      return {success: true, data: mockUser};
    }

    const response = await apiClient.get<{success: boolean; data: ApiUser}>(
      '/auth/me',
    );
    return {success: true, data: mapApiUser(response.data.data)};
  },

  forgotPassword: async (email: string): Promise<void> => {
    if (USE_MOCK_DATA) {
      await delay(500);
      return;
    }
    await apiClient.post('/auth/forgot-password', {email});
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    if (USE_MOCK_DATA) {
      await delay(500);
      return;
    }
    await apiClient.post('/auth/reset-password', {token, password});
  },
};
