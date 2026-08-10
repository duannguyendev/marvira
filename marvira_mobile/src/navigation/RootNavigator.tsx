import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import {
  consumePendingNotificationId,
  navigationRef,
  navigateToEventDetails,
  navigateToNotificationDetail,
  resolveNotificationNavigation,
  setPendingNotificationId,
} from './navigationRef';
import { RootStackParamList } from './types';
import { useAuth } from '../hooks/useAuth';
import { Screen } from '../components/Screen';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { authSession } from '../services/authSession';
import { AnalyticsEvents } from '../services/analytics';
import { pushNotifications } from '../services/pushNotifications';
import { invalidateNotificationQueries } from '../hooks/useNotifications';
import {
  consumePendingInviteEventId,
  parseInviteUrl,
  setPendingInviteEventId,
} from '../utils/inviteLinks';

const Stack = createNativeStackNavigator<RootStackParamList>();

function extractPushPayload(remoteMessage: unknown): {
  notificationId?: string;
  eventId?: string;
  type?: string;
} {
  if (!remoteMessage || typeof remoteMessage !== 'object') return {};
  const data = (remoteMessage as { data?: Record<string, string> }).data;
  if (!data) return {};
  return {
    notificationId: data.notificationId,
    eventId: data.eventId,
    type: data.type,
  };
}

function trackAndResolveInvite(
  url: string | null,
  canNavigate: boolean,
): void {
  if (!url) {
    return;
  }
  const info = parseInviteUrl(url);
  void AnalyticsEvents.inviteOpened(info.eventId, info.linkType);
  if (!info.eventId) {
    return;
  }
  if (canNavigate) {
    const navigated = navigateToEventDetails(info.eventId);
    if (!navigated) {
      setPendingInviteEventId(info.eventId);
    }
  } else {
    setPendingInviteEventId(info.eventId);
  }
}

function openPendingInviteIfAny(): void {
  const eventId = consumePendingInviteEventId();
  if (!eventId) {
    return;
  }
  const navigated = navigateToEventDetails(eventId);
  if (!navigated) {
    setPendingInviteEventId(eventId);
  }
}

function openPendingNotificationIfAny(): void {
  const id = consumePendingNotificationId();
  if (!id) return;
  const navigated = navigateToNotificationDetail(id);
  if (!navigated) setPendingNotificationId(id);
}

export const RootNavigator: React.FC = () => {
  const { i18n } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [sessionKey, setSessionKey] = useState(0);
  const canNavigateRef = useRef(false);
  canNavigateRef.current = isAuthenticated && !isLoading;

  useEffect(() => {
    return authSession.subscribe(() => {
      // Flip auth off immediately so Root never remounts into the boot spinner
      queryClient.setQueryData(['user'], null);
      queryClient.removeQueries({
        predicate: query => query.queryKey[0] !== 'user',
      });
      setSessionKey(k => k + 1);
    });
  }, [queryClient]);

  useEffect(() => {
    const handleUrl = (url: string | null) => {
      trackAndResolveInvite(url, canNavigateRef.current);
    };
    void Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    void pushNotifications.registerIfAuthenticated();
    const unsubRefresh = pushNotifications.subscribeTokenRefresh();

    const unsubForeground = pushNotifications.onForegroundMessage(msg => {
      const payload = extractPushPayload(msg);
      void AnalyticsEvents.notificationReceived(payload.type);
      invalidateNotificationQueries(queryClient);
    });

    const unsubOpened = pushNotifications.onNotificationOpened(msg => {
      const payload = extractPushPayload(msg);
      void AnalyticsEvents.notificationOpened(
        payload.type,
        payload.notificationId,
      );
      resolveNotificationNavigation(payload);
    });

    void pushNotifications.getInitialNotification().then(msg => {
      if (!msg) return;
      const payload = extractPushPayload(msg);
      void AnalyticsEvents.notificationOpened(
        payload.type,
        payload.notificationId,
      );
      if (canNavigateRef.current) {
        resolveNotificationNavigation(payload);
      } else if (payload.notificationId) {
        setPendingNotificationId(payload.notificationId);
      }
    });

    const appStateSub = AppState.addEventListener('change', state => {
      if (state === 'active' && canNavigateRef.current) {
        void pushNotifications.registerIfAuthenticated();
        invalidateNotificationQueries(queryClient);
      }
    });

    return () => {
      unsubRefresh();
      unsubForeground();
      unsubOpened();
      appStateSub.remove();
    };
  }, [isAuthenticated, isLoading, queryClient]);

  const handleNavigationReady = useCallback(() => {
    if (isAuthenticated) {
      openPendingInviteIfAny();
      openPendingNotificationIfAny();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && !isLoading && navigationRef.isReady()) {
      openPendingInviteIfAny();
      openPendingNotificationIfAny();
    }
  }, [isAuthenticated, isLoading]);

  // Only gate cold start — never flash spinner when session expires mid-use
  if (isLoading) {
    return (
      <Screen edges={['top', 'bottom', 'left', 'right']}>
        <LoadingSpinner fullScreen />
      </Screen>
    );
  }

  return (
    <NavigationContainer
      key={`${sessionKey}-${i18n.language}`}
      ref={navigationRef}
      onReady={handleNavigationReady}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
