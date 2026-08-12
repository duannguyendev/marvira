import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useEventLeaderboard } from '../../hooks/useLeaderboard';
import { useAuth } from '../../hooks/useAuth';
import { LeaderboardList } from '../../components/LeaderboardList';
import { LeaderboardHeaderSkeleton } from '../../components/skeleton/ListRowSkeletons';
import { ErrorView } from '../../components/ErrorView';
import { colors, spacing, fontSize, fontWeight } from '../../theme';
import { HomeStackParamList } from '../../navigation/types';

type ScreenRoute = RouteProp<HomeStackParamList, 'EventLeaderboard'>;

export const EventLeaderboardScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<ScreenRoute>();
  const { eventId } = route.params;
  const { user } = useAuth();

  const { data, isLoading, isFetching, error, refetch } =
    useEventLeaderboard(eventId);

  if (error && !data) {
    return (
      <ErrorView
        message={(error as Error).message || t('leaderboard.loadFailed')}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <View style={styles.container}>
      {data?.event ? (
        <View style={styles.header}>
          <Text style={styles.title}>{data.event.title}</Text>
          {data.event.city ? (
            <Text style={styles.subtitle}>{data.event.city}</Text>
          ) : null}
          <Text style={styles.hint}>{t('leaderboard.rankedByScore')}</Text>
        </View>
      ) : isLoading ? (
        <LeaderboardHeaderSkeleton />
      ) : null}

      <LeaderboardList
        variant="event"
        entries={data?.entries ?? []}
        currentUserId={user?.id}
        isLoading={isLoading}
        isRefetching={isFetching && !isLoading}
        onRefresh={() => refetch()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginTop: spacing.sm,
  },
});
