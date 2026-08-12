import React from 'react';
import { View, StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '../theme';
import { SkeletonBone, SkeletonPulse } from './skeleton/Skeleton';

type EventCardLayout = 'card' | 'compact';

type EventCardSkeletonProps = {
  /** `card` matches EventCard; `compact` matches MyEventCard. */
  layout?: EventCardLayout;
};

export const EventCardSkeleton: React.FC<EventCardSkeletonProps> = ({
  layout = 'card',
}) => {
  const compact = layout === 'compact';

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <SkeletonBone
        height={compact ? 120 : 180}
        radius={0}
        style={styles.image}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <SkeletonBone height={20} style={styles.title} />
          <SkeletonBone width={72} height={22} radius={borderRadius.md} />
        </View>
        <SkeletonBone style={styles.line} />
        <SkeletonBone width="65%" style={styles.lineShort} />
        <View style={styles.footer}>
          <SkeletonBone width={64} height={12} />
          <SkeletonBone width={100} height={12} />
        </View>
      </View>
    </View>
  );
};

type EventListSkeletonProps = {
  count?: number;
  layout?: EventCardLayout;
  /** Extra vertical padding. Turn off when nested in an already-padded list. */
  padded?: boolean;
};

export const EventListSkeleton: React.FC<EventListSkeletonProps> = ({
  count = 3,
  layout = 'card',
  padded = layout === 'card',
}) => (
  <SkeletonPulse
    style={
      padded ? styles.list : layout === 'compact' ? styles.listCompact : undefined
    }>
    {Array.from({ length: count }, (_, index) => (
      <EventCardSkeleton key={index} layout={layout} />
    ))}
  </SkeletonPulse>
);

const styles = StyleSheet.create({
  list: {
    paddingVertical: spacing.md,
  },
  listCompact: {
    paddingTop: spacing.xs,
  },
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  containerCompact: {
    marginHorizontal: 0,
    borderRadius: borderRadius.lg,
  },
  image: {
    width: '100%',
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  title: {
    flex: 1,
    marginRight: spacing.sm,
  },
  line: {
    marginBottom: spacing.sm,
  },
  lineShort: {
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
