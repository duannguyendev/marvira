import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { borderRadius, colors, spacing } from '../../theme';
import { SkeletonBone, SkeletonPulse } from './Skeleton';

const { height } = Dimensions.get('window');

const PlaceCardSkeleton: React.FC = () => (
  <View style={styles.placeCard}>
    <SkeletonBone width={32} height={32} radius={borderRadius.round} />
    <View style={styles.placeCardBody}>
      <SkeletonBone width="70%" height={16} style={styles.placeName} />
      <SkeletonBone width="90%" height={12} />
    </View>
    <SkeletonBone width={44} height={28} radius={borderRadius.sm} />
  </View>
);

export const EventDetailsSkeleton: React.FC = () => (
  <SkeletonPulse style={styles.screen}>
    <View style={[styles.map, { height: height * 0.4 }]} />
    <View style={styles.padded}>
      <SkeletonBone width="80%" height={26} style={styles.title} />
      <SkeletonBone width="35%" height={14} style={styles.meta} />
      <SkeletonBone width="50%" height={14} style={styles.meta} />
      <SkeletonBone height={8} radius={borderRadius.sm} style={styles.progress} />
      <SkeletonBone width="40%" height={12} style={styles.section} />
      <SkeletonBone height={14} style={styles.desc} />
      <SkeletonBone width="90%" height={14} style={styles.desc} />
      <SkeletonBone width="55%" height={18} style={styles.section} />
      <PlaceCardSkeleton />
      <PlaceCardSkeleton />
    </View>
  </SkeletonPulse>
);

export const QuestionBlockSkeleton: React.FC = () => (
  <SkeletonPulse>
    <SkeletonBone width={88} height={14} style={styles.questionLabel} />
    <View style={styles.questionCard}>
      <SkeletonBone height={16} style={styles.desc} />
      <SkeletonBone width="85%" height={16} style={styles.desc} />
      <SkeletonBone width="70%" height={16} style={styles.section} />
      <SkeletonBone height={44} radius={borderRadius.md} style={styles.option} />
      <SkeletonBone height={44} radius={borderRadius.md} />
    </View>
  </SkeletonPulse>
);

export const PlaceGameSkeleton: React.FC = () => (
  <SkeletonPulse style={styles.screen}>
    <View style={[styles.map, { height: height * 0.35 }]} />
    <View style={styles.padded}>
      <SkeletonBone width="65%" height={26} style={styles.title} />
      <SkeletonBone width="90%" height={14} style={styles.meta} />
      <View style={styles.distanceBox}>
        <SkeletonBone width="50%" height={16} style={styles.meta} />
        <SkeletonBone width="70%" height={12} />
      </View>
      <SkeletonBone width={88} height={14} style={styles.questionLabel} />
      <View style={styles.questionCard}>
        <SkeletonBone height={16} style={styles.desc} />
        <SkeletonBone width="80%" height={16} />
      </View>
    </View>
  </SkeletonPulse>
);

export const QuestionTrainingSkeleton: React.FC = () => (
  <SkeletonPulse style={styles.screen}>
    <View style={styles.padded}>
      <SkeletonBone width={120} height={14} style={styles.meta} />
      <SkeletonBone width="80%" height={14} style={styles.section} />
      <View style={styles.questionCard}>
        <SkeletonBone width={88} height={14} style={styles.questionLabel} />
        <SkeletonBone height={16} style={styles.desc} />
        <SkeletonBone width="90%" height={16} style={styles.desc} />
        <SkeletonBone width="60%" height={16} style={styles.section} />
        <SkeletonBone height={44} radius={borderRadius.md} style={styles.option} />
        <SkeletonBone height={44} radius={borderRadius.md} />
      </View>
    </View>
    <View style={styles.submitFooter}>
      <SkeletonBone height={48} radius={borderRadius.md} />
    </View>
  </SkeletonPulse>
);

export const CreateEventReviewSkeleton: React.FC = () => (
  <SkeletonPulse style={styles.padded}>
    <SkeletonBone width="55%" height={22} style={styles.title} />
    <SkeletonBone width="80%" height={14} style={styles.section} />
    <View style={styles.summaryCard}>
      <SkeletonBone width="70%" height={18} style={styles.meta} />
      <SkeletonBone width="50%" height={14} />
    </View>
    <View style={[styles.map, styles.reviewMap, { height: height * 0.28 }]} />
    <View style={styles.summaryCard}>
      <SkeletonBone width="40%" height={16} style={styles.meta} />
      <SkeletonBone width="85%" height={14} style={styles.desc} />
      <View style={styles.accessRow}>
        <SkeletonBone height={40} radius={borderRadius.md} style={styles.flex} />
        <SkeletonBone height={40} radius={borderRadius.md} style={styles.flex} />
      </View>
    </View>
    <View style={styles.summaryCard}>
      <SkeletonBone width="35%" height={16} style={styles.meta} />
      <SkeletonBone height={44} radius={borderRadius.md} style={styles.option} />
      <SkeletonBone height={44} radius={borderRadius.md} />
    </View>
  </SkeletonPulse>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  flex: {
    flex: 1,
  },
  map: {
    width: '100%',
    backgroundColor: colors.border,
  },
  reviewMap: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  padded: {
    padding: spacing.md,
  },
  title: {
    marginBottom: spacing.sm,
  },
  meta: {
    marginBottom: spacing.xs,
  },
  progress: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  desc: {
    marginBottom: spacing.sm,
  },
  section: {
    marginBottom: spacing.md,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
  },
  placeCardBody: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  placeName: {
    marginBottom: spacing.xs,
  },
  distanceBox: {
    backgroundColor: colors.infoLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  questionLabel: {
    marginBottom: spacing.sm,
  },
  questionCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  option: {
    marginBottom: spacing.sm,
  },
  submitFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  accessRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
