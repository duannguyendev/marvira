import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeNavigator } from './HomeNavigator';
import { PracticeNavigator } from './PracticeNavigator';
import { FavoritesNavigator } from './FavoritesNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { MainTabParamList } from './types';
import { colors } from '../theme';
import { Text } from 'react-native';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tabBarPaddingBottom = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 8,
          height: 52 + tabBarPaddingBottom,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        options={{
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>🏠</Text>,
          tabBarLabel: t('nav.events'),
        }}
      />
      <Tab.Screen
        name="Practice"
        component={PracticeNavigator}
        options={{
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>📚</Text>,
          tabBarLabel: t('nav.practice'),
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesNavigator}
        options={{
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>⭐</Text>,
          tabBarLabel: t('nav.favorites'),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>👤</Text>,
          tabBarLabel: t('nav.profile'),
        }}
      />
    </Tab.Navigator>
  );
};
