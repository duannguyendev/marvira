import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateToEventDetails(eventId: string): boolean {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.navigate('Main', {
    screen: 'Home',
    params: {
      screen: 'EventDetails',
      params: { eventId },
    },
  });
  return true;
}

export function navigateToNotificationDetail(notificationId: string): boolean {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.navigate('Main', {
    screen: 'Profile',
    params: {
      screen: 'NotificationDetail',
      params: { notificationId },
    },
  });
  return true;
}

let pendingNotificationId: string | null = null;

export function setPendingNotificationId(id: string | null) {
  pendingNotificationId = id;
}

export function consumePendingNotificationId(): string | null {
  const id = pendingNotificationId;
  pendingNotificationId = null;
  return id;
}

export function resolveNotificationNavigation(payload: {
  notificationId?: string;
  eventId?: string;
}): boolean {
  if (payload.notificationId) {
    const ok = navigateToNotificationDetail(payload.notificationId);
    if (!ok) setPendingNotificationId(payload.notificationId);
    return ok;
  }
  if (payload.eventId) {
    return navigateToEventDetails(payload.eventId);
  }
  return false;
}
