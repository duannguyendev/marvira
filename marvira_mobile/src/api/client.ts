import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getApiBaseUrl } from '../config/apiEnvironment';
import { storage } from '../utils/storage';
import { ApiError } from '../types';
import { authSession } from '../services/authSession';
import { ApiAuthTokens } from '../types/api';

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/** True when the server rejected the session — not for network/transient errors. */
function isInvalidSessionError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    return status === 401 || status === 403;
  }
  return error instanceof Error && error.message === 'No refresh token';
}

async function forceLogout(): Promise<void> {
  await storage.clearAll();
  authSession.notifyLogout();
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await storage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  // API returns flat TokenPair (not { user, tokens } like login)
  const response = await axios.post<{ success: boolean; data: ApiAuthTokens }>(
    `${getApiBaseUrl()}/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  );

  const { accessToken, refreshToken: newRefreshToken } = response.data.data;
  await storage.setToken(accessToken);
  await storage.setRefreshToken(newRefreshToken);
  return accessToken;
}

function processQueue(error: unknown, token: string | null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  refreshQueue = [];
}

class ApiClient {
  private client = axios.create({
    baseURL: (() => {
      try {
        return getApiBaseUrl();
      } catch {
        return '';
      }
    })(),
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  constructor() {
    this.client.interceptors.request.use(
      async config => {
        config.baseURL = getApiBaseUrl();
        const token = await storage.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error),
    );

    this.client.interceptors.response.use(
      response => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        if (error.response?.status !== 401 || !originalRequest) {
          return Promise.reject(this.handleError(error));
        }

        // Refresh endpoint itself returned 401 → session is dead
        if (originalRequest.url?.includes('/auth/refresh')) {
          await forceLogout();
          return Promise.reject(this.handleError(error));
        }

        if (originalRequest._retry) {
          await forceLogout();
          return Promise.reject(this.handleError(error));
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            refreshQueue.push({
              resolve: (token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.client(originalRequest));
              },
              reject,
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const newToken = await refreshAccessToken();
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return this.client(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          // Only clear session when refresh token is rejected — keep
          // credentials on network blips when returning from background.
          if (isInvalidSessionError(refreshError)) {
            await forceLogout();
          }
          return Promise.reject(this.handleError(error));
        } finally {
          isRefreshing = false;
        }
      },
    );
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      const data = error.response.data as {
        message?: string | string[];
        code?: string;
      };
      const message = Array.isArray(data?.message)
        ? data.message.join(', ')
        : data?.message || error.message || 'An error occurred';
      return {
        message,
        code: data?.code,
        status: error.response.status,
      };
    }
    if (error.request) {
      return { message: 'Network error. Please check your connection.' };
    }
    return { message: error.message || 'An unexpected error occurred' };
  }

  getInstance() {
    return this.client;
  }
}

export const apiClient = new ApiClient().getInstance();
