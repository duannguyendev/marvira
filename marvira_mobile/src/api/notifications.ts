import { apiClient } from './client';

export type NotificationItem = {
  id: string;
  type: string;
  category: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationPreferences = {
  gameplayEnabled: boolean;
  creatorEnabled: boolean;
  productEnabled: boolean;
};

export const notificationsApi = {
  list: async (params?: {
    cursor?: string;
    limit?: number;
    unreadOnly?: boolean;
  }) => {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        items: NotificationItem[];
        nextCursor?: string;
        unreadCount: number;
      };
    }>('/notifications', { params });
    return response.data.data;
  },

  unreadCount: async () => {
    const response = await apiClient.get<{
      success: boolean;
      data: { unreadCount: number };
    }>('/notifications/unread-count');
    return response.data.data;
  },

  getOne: async (id: string) => {
    const response = await apiClient.get<{
      success: boolean;
      data: NotificationItem;
    }>(`/notifications/${id}`);
    return response.data.data;
  },

  markRead: async (id: string) => {
    const response = await apiClient.patch<{
      success: boolean;
      data: NotificationItem;
    }>(`/notifications/${id}/read`);
    return response.data.data;
  },

  markAllRead: async () => {
    const response = await apiClient.post<{
      success: boolean;
      data: { updated: number };
    }>('/notifications/read-all');
    return response.data.data;
  },

  getPreferences: async () => {
    const response = await apiClient.get<{
      success: boolean;
      data: NotificationPreferences;
    }>('/notifications/preferences');
    return response.data.data;
  },

  updatePreferences: async (prefs: Partial<NotificationPreferences>) => {
    const response = await apiClient.post<{
      success: boolean;
      data: NotificationPreferences;
    }>('/notifications/preferences', prefs);
    return response.data.data;
  },

  registerDevice: async (input: {
    fcmToken: string;
    platform: 'ANDROID' | 'IOS';
    appVersion?: string;
    locale?: string;
  }) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { id: string; fcmToken: string; platform: string; lastSeenAt: string };
    }>('/devices', input);
    return response.data.data;
  },

  unregisterDevice: async (fcmToken: string) => {
    await apiClient.delete('/devices', { data: { fcmToken } });
  },
};
