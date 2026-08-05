import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import { useCompletedEvents } from '../../hooks/useProfile';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EventCard } from '../../components/EventCard';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '../../theme';
import {
  HomeStackParamList,
  MainTabParamList,
  ProfileStackParamList,
} from '../../navigation/types';

type ProfileScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Profile'>,
    NativeStackNavigationProp<HomeStackParamList>
  >
>;

export const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout, isLoggingOut } = useAuth();
  const { data: completedData, isLoading: eventsLoading } =
    useCompletedEvents();
  const { data: unreadData } = useUnreadNotificationCount(!!user);
  const unreadCount = unreadData?.unreadCount ?? 0;

  const handleLogout = () => {
    Alert.alert(
      t('profile.logoutConfirmTitle'),
      t('profile.logoutConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error: any) {
              Alert.alert(
                t('common.error'),
                error.message || t('profile.logoutFailed'),
              );
            }
          },
        },
      ],
    );
  };

  const completedEvents = completedData?.data || [];
  const totalScore = completedEvents.reduce(
    (sum, event) => sum + (event.score ?? 0),
    0,
  );

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}>
        <View style={styles.profileContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name || t('common.user')}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.settingsIcon}>🔔</Text>
          <Text style={styles.settingsText}>{t('profile.notifications')}</Text>
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : String(unreadCount)}
              </Text>
            </View>
          ) : null}
          <Text style={styles.settingsChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
          <Text style={styles.settingsText}>{t('profile.settings')}</Text>
          <Text style={styles.settingsChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('MyEvents')}>
          <Text style={styles.settingsIcon}>📋</Text>
          <Text style={styles.settingsText}>{t('profile.myEvents')}</Text>
          <Text style={styles.settingsChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('MyQuestions')}>
          <Text style={styles.settingsIcon}>❓</Text>
          <Text style={styles.settingsText}>{t('profile.myQuestions')}</Text>
          <Text style={styles.settingsChevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.statistics')}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{completedEvents.length}</Text>
              <Text style={styles.statLabel}>
                {t('profile.eventsCompleted')}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalScore}</Text>
              <Text style={styles.statLabel}>{t('profile.totalScore')}</Text>
            </View>
          </View>
          <Button
            title={t('profile.globalLeaderboard')}
            onPress={() =>
              navigation.navigate('Home', {
                screen: 'GlobalLeaderboard',
              } as MainTabParamList['Home'])
            }
            variant="outline"
            fullWidth
            style={styles.leaderboardButton}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('profile.completedEvents')}
          </Text>
          {eventsLoading ? (
            <LoadingSpinner />
          ) : completedEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {t('profile.noCompletedEvents')}
              </Text>
              <Text style={styles.emptySubtext}>
                {t('profile.startExploring')}
              </Text>
            </View>
          ) : (
            completedEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => {
                  navigation.navigate('Home', {
                    screen: 'EventDetails',
                    params: { eventId: event.id },
                  } as MainTabParamList['Home']);
                }}
              />
            ))
          )}
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoggingOut}>
          <Text style={styles.logoutText}>
            {isLoggingOut ? t('profile.loggingOut') : t('profile.logout')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  profileContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.background,
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: fontSize.md,
    color: colors.background,
    opacity: 0.9,
  },
  content: {
    padding: spacing.md,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsIcon: {
    fontSize: fontSize.xl,
    marginRight: spacing.md,
  },
  settingsText: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textDark,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginRight: spacing.sm,
  },
  badgeText: {
    color: colors.background,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  settingsChevron: {
    fontSize: fontSize.xxl,
    color: colors.textLight,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statValue: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  leaderboardButton: {
    marginTop: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
  },
  emptyText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: colors.error,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  logoutText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.background,
  },
});
