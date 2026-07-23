import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { RootStackParamList } from './types';
import { useAuth } from '../hooks/useAuth';
import { Screen } from '../components/Screen';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { authSession } from '../services/authSession';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { i18n } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    return authSession.subscribe(() => {
      queryClient.clear();
      setSessionKey(k => k + 1);
    });
  }, [queryClient]);

  if (isLoading) {
    return (
      <Screen edges={['top', 'bottom', 'left', 'right']}>
        <LoadingSpinner fullScreen />
      </Screen>
    );
  }

  return (
    <NavigationContainer key={`${sessionKey}-${i18n.language}`}>
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
