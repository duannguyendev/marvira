import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, NotificationPreferences } from '../api/notifications';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (unreadOnly?: boolean) =>
    [...notificationKeys.all, 'list', { unreadOnly }] as const,
  detail: (id: string) => [...notificationKeys.all, 'detail', id] as const,
  unread: [...(['notifications', 'unread'] as const)],
  preferences: [...(['notifications', 'preferences'] as const)],
};

export const useNotifications = (unreadOnly = false) => {
  return useQuery({
    queryKey: notificationKeys.list(unreadOnly),
    queryFn: () => notificationsApi.list({ unreadOnly, limit: 30 }),
    staleTime: 15_000,
  });
};

export const useNotification = (id: string) => {
  return useQuery({
    queryKey: notificationKeys.detail(id),
    queryFn: () => notificationsApi.getOne(id),
    enabled: !!id,
  });
};

export const useUnreadNotificationCount = (enabled = true) => {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: () => notificationsApi.unreadCount(),
    staleTime: 15_000,
    refetchInterval: 60_000,
    enabled,
  });
};

export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: notificationKeys.preferences,
    queryFn: () => notificationsApi.getPreferences(),
    staleTime: 60_000,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unread });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unread });
    },
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prefs: Partial<NotificationPreferences>) =>
      notificationsApi.updatePreferences(prefs),
    onSuccess: data => {
      queryClient.setQueryData(notificationKeys.preferences, data);
    },
  });
};

export function invalidateNotificationQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  void queryClient.invalidateQueries({ queryKey: notificationKeys.unread });
}
