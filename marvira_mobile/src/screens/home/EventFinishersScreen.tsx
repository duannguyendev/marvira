import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../../api/events';
import { EventFinishersSkeleton } from '../../components/skeleton/ListRowSkeletons';
import { ErrorView } from '../../components/ErrorView';
import { HomeStackParamList } from '../../navigation/types';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '../../theme';
import { formatDuration } from '../../utils/formatDuration';

type Route = RouteProp<HomeStackParamList, 'EventFinishers'>;

export const EventFinishersScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<Route>();
  const { eventId } = route.params;

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['eventFinishers', eventId],
    queryFn: () => eventsApi.getEventFinishers(eventId),
  });

  if (isLoading && !data) {
    return (
      <View style={styles.container}>
        <EventFinishersSkeleton />
      </View>
    );
  }

  if (error || !data?.data) {
    return (
      <ErrorView
        message={(error as any)?.message || t('finishers.loadFailed')}
        onRetry={() => refetch()}
      />
    );
  }

  const { event, giftCount, giftAssignedCount, finishers } = data.data;

  return (
    <View style={styles.container}>
      <FlatList
        data={finishers}
        keyExtractor={item => item.userId}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{event.title}</Text>
            <Text style={styles.summary}>
              {giftCount > 0
                ? t('finishers.assignedSummary', {
                    assigned: giftAssignedCount,
                    total: giftCount,
                  })
                : t('finishers.noGifts')}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>{t('finishers.empty')}</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{item.finishRank ?? '—'}</Text>
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.name}>{item.userName}</Text>
              <Text style={styles.meta}>
                {item.totalDurationMs != null
                  ? formatDuration(item.totalDurationMs)
                  : '—'}{' '}
                · {item.score} {t('common.pts')}
              </Text>
              {item.giftCodeAwarded ? (
                <Text style={styles.code} selectable>
                  {t('finishers.code')}: {item.giftCodeAwarded}
                </Text>
              ) : null}
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  summary: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  empty: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: colors.background,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.sm,
  },
  rowBody: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textDark,
  },
  meta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  code: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
});
