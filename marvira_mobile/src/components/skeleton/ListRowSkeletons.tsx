import React from 'react';
import { StyleSheet, View } from 'react-native';
import { borderRadius, colors, spacing } from '../../theme';
import { SkeletonBone, SkeletonPulse } from './Skeleton';

export const NotificationRowSkeleton: React.FC = () => (
  <View style={styles.notificationRow}>
    <View style={styles.notificationBody}>
      <SkeletonBone width="75%" height={16} />
      <SkeletonBone width="95%" height={13} style={styles.notificationLine} />
      <SkeletonBone width={72} height={11} />
    </View>
    <SkeletonBone width={12} height={22} radius={borderRadius.sm} />
  </View>
);

type CountProps = {
  count?: number;
};

export const NotificationListSkeleton: React.FC<CountProps> = ({
  count = 6,
}) => (
  <SkeletonPulse style={styles.paddedList}>
    {Array.from({ length: count }, (_, index) => (
      <NotificationRowSkeleton key={index} />
    ))}
  </SkeletonPulse>
);

export const LeaderboardRowSkeleton: React.FC = () => (
  <View style={styles.leaderboardRow}>
    <SkeletonBone width={40} height={40} radius={borderRadius.round} />
    <View style={styles.leaderboardBody}>
      <SkeletonBone width="55%" height={16} style={styles.leaderboardName} />
      <SkeletonBone width="40%" height={12} />
    </View>
    <SkeletonBone width={36} height={20} />
  </View>
);

export const LeaderboardHeaderSkeleton: React.FC = () => (
  <SkeletonPulse style={styles.leaderboardHeader}>
    <SkeletonBone width="70%" height={22} style={styles.headerTitle} />
    <SkeletonBone width="40%" height={14} style={styles.headerLine} />
    <SkeletonBone width="55%" height={14} />
  </SkeletonPulse>
);

export const LeaderboardListSkeleton: React.FC<CountProps> = ({
  count = 8,
}) => (
  <SkeletonPulse style={styles.paddedList}>
    {Array.from({ length: count }, (_, index) => (
      <LeaderboardRowSkeleton key={index} />
    ))}
  </SkeletonPulse>
);

export const EventFinishersSkeleton: React.FC = () => (
  <SkeletonPulse style={styles.paddedList}>
    <SkeletonBone width="70%" height={22} style={styles.headerTitle} />
    <SkeletonBone width="50%" height={14} style={styles.finishersSummary} />
    {Array.from({ length: 6 }, (_, index) => (
      <LeaderboardRowSkeleton key={index} />
    ))}
  </SkeletonPulse>
);

const styles = StyleSheet.create({
  paddedList: {
    padding: spacing.md,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationBody: {
    flex: 1,
    marginRight: spacing.sm,
  },
  notificationLine: {
    marginVertical: spacing.xs,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  leaderboardBody: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  leaderboardName: {
    marginBottom: 6,
  },
  leaderboardHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    marginBottom: spacing.xs,
  },
  headerLine: {
    marginBottom: spacing.sm,
  },
  finishersSummary: {
    marginBottom: spacing.lg,
  },
});
