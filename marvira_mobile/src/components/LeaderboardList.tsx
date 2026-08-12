import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ListRenderItem,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LeaderboardListSkeleton } from './skeleton/ListRowSkeletons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { formatDuration } from '../utils/formatDuration';
import {
  ApiEventLeaderboardEntry,
  ApiGlobalLeaderboardEntry,
} from '../types/api';

type LeaderboardListProps =
  | {
      variant: 'event';
      entries: ApiEventLeaderboardEntry[];
      currentUserId?: string;
      isLoading: boolean;
      isRefetching: boolean;
      onRefresh: () => void;
    }
  | {
      variant: 'global';
      entries: ApiGlobalLeaderboardEntry[];
      currentUserId?: string;
      isLoading: boolean;
      isRefetching: boolean;
      onRefresh: () => void;
    };

function RankBadge({ rank }: { rank: number }) {
  const medal =
    rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

  return (
    <View style={[styles.rankBadge, rank <= 3 && styles.rankBadgeTop]}>
      {medal ? (
        <Text style={styles.medal}>{medal}</Text>
      ) : (
        <Text style={styles.rankText}>{rank}</Text>
      )}
    </View>
  );
}

export const LeaderboardList: React.FC<LeaderboardListProps> = props => {
  const { t } = useTranslation();
  const { entries, currentUserId, isLoading, isRefetching, onRefresh } = props;

  if (isLoading && entries.length === 0) {
    return <LeaderboardListSkeleton />;
  }

  const renderEventRow: ListRenderItem<ApiEventLeaderboardEntry> = ({
    item,
  }) => {
    const isCurrentUser = currentUserId === item.userId;
    return (
      <View style={[styles.row, isCurrentUser && styles.rowHighlight]}>
        <RankBadge rank={item.rank} />
        <View style={styles.rowBody}>
          <Text style={[styles.name, isCurrentUser && styles.nameHighlight]}>
            {item.userName}
            {isCurrentUser ? ` ${t('common.you')}` : ''}
          </Text>
          <Text style={styles.meta}>
            {t('leaderboard.scoreDuration', {
              score: item.score,
              duration: formatDuration(item.totalDurationMs),
            })}
          </Text>
        </View>
        <Text style={styles.score}>{item.score}</Text>
      </View>
    );
  };

  const renderGlobalRow: ListRenderItem<ApiGlobalLeaderboardEntry> = ({
    item,
  }) => {
    const isCurrentUser = currentUserId === item.userId;
    const eventsLabel =
      item.eventsCompleted === 1 ? t('common.event') : t('common.events');
    return (
      <View style={[styles.row, isCurrentUser && styles.rowHighlight]}>
        <RankBadge rank={item.rank} />
        <View style={styles.rowBody}>
          <Text style={[styles.name, isCurrentUser && styles.nameHighlight]}>
            {item.userName}
            {isCurrentUser ? ` ${t('common.you')}` : ''}
          </Text>
          <Text style={styles.meta}>
            {t('leaderboard.eventsAvg', {
              count: item.eventsCompleted,
              eventsLabel,
              duration: formatDuration(item.avgDurationMs),
            })}
          </Text>
        </View>
        <Text style={styles.score}>{item.totalScore}</Text>
      </View>
    );
  };

  const emptyMessage =
    props.variant === 'event'
      ? t('leaderboard.eventEmpty')
      : t('leaderboard.globalEmpty');

  type LeaderboardEntry = ApiEventLeaderboardEntry | ApiGlobalLeaderboardEntry;

  return (
    <FlatList<LeaderboardEntry>
      data={entries as LeaderboardEntry[]}
      keyExtractor={item => `${item.userId}-${item.rank}`}
      renderItem={
        (props.variant === 'event'
          ? renderEventRow
          : renderGlobalRow) as ListRenderItem<LeaderboardEntry>
      }
      contentContainerStyle={
        entries.length === 0 ? styles.emptyContainer : styles.listContent
      }
      ListEmptyComponent={
        !isLoading ? (
          <View style={styles.emptyInner}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        ) : null
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  rowHighlight: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.infoLight,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: colors.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rankBadgeTop: {
    backgroundColor: colors.background,
  },
  medal: {
    fontSize: 22,
  },
  rankText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  rowBody: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textDark,
    marginBottom: 2,
  },
  nameHighlight: {
    color: colors.primary,
  },
  meta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  score: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyInner: {
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
