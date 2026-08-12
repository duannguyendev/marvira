import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeNavigator } from './HomeNavigator';
import { PracticeNavigator } from './PracticeNavigator';
import { FavoritesNavigator } from './FavoritesNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { MainTabParamList } from './types';
import { useUnreadNotificationCount } from '../hooks/useNotifications';
import { colors, fontWeight } from '../theme';

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

const TabIconWithBadge: React.FC<{ emoji: string; badgeCount: number }> = ({
  emoji,
  badgeCount,
}) => (
  <View style={tabBadgeStyles.wrapper}>
    <Text style={tabIconStyle}>{emoji}</Text>
    {badgeCount > 0 ? (
      <View style={tabBadgeStyles.badge}>
        <Text style={tabBadgeStyles.badgeText}>
          {badgeCount > 9 ? '9+' : String(badgeCount)}
        </Text>
      </View>
    ) : null}
  </View>
);

export const MainNavigator: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData?.unreadCount ?? 0;
  /**
   * Bottom padding for the tab bar:
   * - iOS: always reserve home-indicator space (min 8).
   * - Android when insets.bottom === 0: window window is already above the
   *   system nav (classic / non-overlapping) → keep a small 6px gap only
   *   (same as before; avoids a blank double-inset strip).
   * - Android when insets.bottom > 0: edge-to-edge / 3-button or gesture bar
   *   overlaps the app → pad by the reported inset so tabs sit above it.
   */
  const bottomInset =
    Platform.OS === 'ios'
      ? Math.max(insets.bottom, 8)
      : insets.bottom > 0
        ? insets.bottom
        : 6;

  return (
    <Tab.Navigator
      // Handle inset ourselves via tabBarStyle so we can branch Android cases.
      safeAreaInsets={{ bottom: 0 }}
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
          tabBarIcon: () => (
            <TabIconWithBadge emoji="👤" badgeCount={unreadCount} />
          ),
          tabBarLabel: t('nav.profile'),
        }}
      />
    </Tab.Navigator>
  );
};

const tabBadgeStyles = StyleSheet.create({
  wrapper: {
    width: 30,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.background,
    fontSize: 9,
    fontWeight: fontWeight.bold,
    lineHeight: 12,
    includeFontPadding: false,
  },
});
