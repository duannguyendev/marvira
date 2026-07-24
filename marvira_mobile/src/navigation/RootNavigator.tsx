import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { navigationRef, navigateToEventDetails } from './navigationRef';
import { RootStackParamList } from './types';
import { useAuth } from '../hooks/useAuth';
import { Screen } from '../components/Screen';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { authSession } from '../services/authSession';
import { AnalyticsEvents } from '../services/analytics';
import {
  consumePendingInviteEventId,
  parseInviteUrl,
  setPendingInviteEventId,
} from '../utils/inviteLinks';

const Stack = createNativeStackNavigator<RootStackParamList>();

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

export const RootNavigator: React.FC = () => {
  const { i18n } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [sessionKey, setSessionKey] = useState(0);
  const canNavigateRef = useRef(false);
  canNavigateRef.current = isAuthenticated && !isLoading;

  useEffect(() => {
    return authSession.subscribe(() => {
      queryClient.clear();
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

  const handleNavigationReady = useCallback(() => {
    if (isAuthenticated) {
      openPendingInviteIfAny();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && !isLoading && navigationRef.isReady()) {
      openPendingInviteIfAny();
    }
  }, [isAuthenticated, isLoading]);

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
