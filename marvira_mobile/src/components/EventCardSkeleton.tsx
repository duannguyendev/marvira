import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';

export const EventCardSkeleton: React.FC = () => {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.image} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.title} />
          <View style={styles.badge} />
        </View>
        <View style={styles.line} />
        <View style={[styles.line, styles.lineShort]} />
        <View style={styles.footer}>
          <View style={styles.meta} />
          <View style={styles.metaWide} />
        </View>
      </View>
    </Animated.View>
  );
};

export const EventListSkeleton: React.FC<{ count?: number }> = ({
  count = 3,
}) => (
  <View style={styles.list}>
    {Array.from({ length: count }, (_, index) => (
      <EventCardSkeleton key={index} />
    ))}
  </View>
);

const bone = {
  backgroundColor: colors.border,
};

const styles = StyleSheet.create({
  list: {
    paddingVertical: spacing.md,
  },
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    ...bone,
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
    height: 20,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
    ...bone,
  },
  badge: {
    width: 72,
    height: 22,
    borderRadius: borderRadius.md,
    ...bone,
  },
  line: {
    height: 14,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    ...bone,
  },
  lineShort: {
    width: '65%',
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    width: 64,
    height: 12,
    borderRadius: borderRadius.sm,
    ...bone,
  },
  metaWide: {
    width: 100,
    height: 12,
    borderRadius: borderRadius.sm,
    ...bone,
  },
});
