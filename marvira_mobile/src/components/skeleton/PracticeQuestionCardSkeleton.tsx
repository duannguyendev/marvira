import React from 'react';
import { StyleSheet, View } from 'react-native';
import { borderRadius, colors, spacing } from '../../theme';
import { SkeletonBone, SkeletonPulse } from './Skeleton';

export const PracticeQuestionCardSkeleton: React.FC = () => (
  <View style={styles.card}>
    <View style={styles.header}>
      <View style={styles.headerText}>
        <SkeletonBone height={16} style={styles.title} />
        <SkeletonBone width="70%" height={16} style={styles.title} />
        <SkeletonBone width="50%" height={12} />
      </View>
      <SkeletonBone width={28} height={28} radius={borderRadius.round} />
    </View>
    <View style={styles.footer}>
      <SkeletonBone width={72} height={22} radius={borderRadius.sm} />
      <SkeletonBone width={48} height={12} />
    </View>
  </View>
);

type PracticeQuestionListSkeletonProps = {
  count?: number;
};

export const PracticeQuestionListSkeleton: React.FC<
  PracticeQuestionListSkeletonProps
> = ({ count = 4 }) => (
  <SkeletonPulse>
    {Array.from({ length: count }, (_, index) => (
      <PracticeQuestionCardSkeleton key={index} />
    ))}
  </SkeletonPulse>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerText: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    marginBottom: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
