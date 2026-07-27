const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const AUTH_COOKIE = 'marvira-auth';

function setAuthCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = `${AUTH_COOKIE}=1; path=/; SameSite=Lax`;
  }
}

function clearAuthCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
}

export interface ApiResult<T> {
  success: boolean;
  data: T;
  message?: string;
}

function formatApiErrorMessage(
  error: { message?: unknown },
  status: number,
): string {
  const message = error.message;
  if (typeof message === 'string' && message.trim()) return message;
  if (Array.isArray(message)) {
    const parts = message.filter(
      (part): part is string => typeof part === 'string' && part.trim() !== '',
    );
    if (parts.length) return parts.join('; ');
  }
  return `HTTP ${status}`;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
      if (this.accessToken) {
        setAuthCookie();
      }
    }
  }

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      setAuthCookie();
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      clearAuthCookie();
    }
  }

  getAccessToken() {
    return this.accessToken;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Marvira-Client': 'dashboard',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(`${API_URL}${path}`, { ...options, headers });

    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        headers.Authorization = `Bearer ${this.accessToken}`;
        response = await fetch(`${API_URL}${path}`, { ...options, headers });
      } else if (typeof window !== 'undefined') {
        this.clearTokens();
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Request failed' }));
      throw new Error(formatApiErrorMessage(error, response.status));
    }

    const result = (await response.json()) as ApiResult<T>;
    return result.data;
  }

  private async tryRefresh(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      if (!response.ok) return false;
      const result = (await response.json()) as ApiResult<{
        accessToken: string;
        refreshToken: string;
      }>;
      this.setTokens(result.data.accessToken, result.data.refreshToken);
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }

  async upload(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {
      'X-Marvira-Client': 'dashboard',
    };
    if (this.accessToken) headers.Authorization = `Bearer ${this.accessToken}`;

    const response = await fetch(`${API_URL}/uploads`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) throw new Error('Upload failed');
    const result = (await response.json()) as ApiResult<{
      url: string;
      filename: string;
    }>;
    return result.data;
  }
}

export const api = new ApiClient();
