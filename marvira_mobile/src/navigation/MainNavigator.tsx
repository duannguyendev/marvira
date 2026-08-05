import React from 'react';
import { Platform, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeNavigator } from './HomeNavigator';
import { PracticeNavigator } from './PracticeNavigator';
import { FavoritesNavigator } from './FavoritesNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { MainTabParamList } from './types';
import { colors } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

/** Icon + label + padding; keep tall enough so emoji don't collide with titles. */
const TAB_BAR_CONTENT_HEIGHT = 58;

const tabIconStyle = {
  fontSize: 22,
  lineHeight: 24,
  includeFontPadding: false,
} as const;

const TabIcon: React.FC<{ emoji: string }> = ({ emoji }) => (
  <Text style={tabIconStyle}>{emoji}</Text>
);

export const MainNavigator: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  /**
   * Android (edgeToEdgeEnabled=false + opaque status bar): the window already
   * sits above the system nav bar — applying insets.bottom again creates a
   * blank strip above the tab bar. iOS still needs the home-indicator inset.
   */
  const bottomInset = Platform.OS === 'ios' ? Math.max(insets.bottom, 8) : 6;

  return (
    <Tab.Navigator
      safeAreaInsets={
        Platform.OS === 'android' ? { bottom: 0 } : undefined
      }
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 4,
          paddingBottom: bottomInset,
          height: TAB_BAR_CONTENT_HEIGHT + bottomInset,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
          marginBottom: 2,
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        options={{
          tabBarIcon: () => <TabIcon emoji="🏠" />,
          tabBarLabel: t('nav.events'),
        }}
      />
      <Tab.Screen
        name="Practice"
        component={PracticeNavigator}
        options={{
          tabBarIcon: () => <TabIcon emoji="📚" />,
          tabBarLabel: t('nav.practice'),
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesNavigator}
        options={{
          tabBarIcon: () => <TabIcon emoji="⭐" />,
          tabBarLabel: t('nav.favorites'),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarIcon: () => <TabIcon emoji="👤" />,
          tabBarLabel: t('nav.profile'),
        }}
      />
    </Tab.Navigator>
  );
};
