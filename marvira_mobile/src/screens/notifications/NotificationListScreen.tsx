import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/types';
import { NotificationItem } from '../../api/notifications';
import {
  useMarkAllNotificationsRead,
  useNotifications,
  invalidateNotificationQueries,
} from '../../hooks/useNotifications';
import { useQueryClient } from '@tanstack/react-query';
import { NotificationListSkeleton } from '../../components/skeleton/ListRowSkeletons';
import { Button } from '../../components/Button';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '../../theme';
import { AnalyticsEvents } from '../../services/analytics';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Notifications'>;

function formatRelative(iso: string, t: (k: string) => string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return t('notifications.justNow');
  if (mins < 60) {
    return t('notifications.minutesAgo').replace('{{count}}', String(mins));
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return t('notifications.hoursAgo').replace('{{count}}', String(hours));
  }
  const days = Math.floor(hours / 24);
  return t('notifications.daysAgo').replace('{{count}}', String(days));
}

export const NotificationListScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const { data, isLoading, isRefetching, refetch } = useNotifications();
  const markAll = useMarkAllNotificationsRead();

  useFocusEffect(
    useCallback(() => {
      void AnalyticsEvents.notificationInboxOpened();
      invalidateNotificationQueries(queryClient);
    }, [queryClient]),
  );

  const items = data?.items ?? [];

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const unread = !item.readAt;
    return (
      <TouchableOpacity
        style={[styles.row, unread && styles.rowUnread]}
        onPress={() =>
          navigation.navigate('NotificationDetail', { notificationId: item.id })
        }
        activeOpacity={0.7}>
        <View style={styles.rowText}>
          <View style={styles.titleRow}>
            {unread ? <View style={styles.dot} /> : null}
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.time}>{formatRelative(item.createdAt, t)}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  if (isLoading && !data) {
    return (
      <View style={styles.container}>
        <NotificationListSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {items.length > 0 ? (
        <View style={styles.toolbar}>
          <Button
            title={t('notifications.markAllRead')}
            onPress={() => markAll.mutate()}
            variant="outline"
            disabled={markAll.isPending || (data?.unreadCount ?? 0) === 0}
          />
        </View>
      ) : null}
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          items.length === 0 ? styles.emptyContainer : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t('notifications.emptyTitle')}</Text>
            <Text style={styles.emptyBody}>{t('notifications.emptyBody')}</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  toolbar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowUnread: {
    borderColor: colors.primaryLight,
  },
  rowText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  title: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  body: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  time: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.textLight,
  },
  chevron: {
    fontSize: 22,
    color: colors.textLight,
    marginLeft: spacing.sm,
  },
  empty: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyBody: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
