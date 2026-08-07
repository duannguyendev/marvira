import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Place } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { formatDistance } from '../utils/distance';

interface PlaceCardProps {
  place: Place;
  isActive?: boolean;
  onPress?: () => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  isActive = false,
  onPress,
}) => {
  const { t } = useTranslation();

  const getStatusIcon = () => {
    if (place.isCompleted) return '✅';
    if (place.isUnlocked) return '🔓';
    return '🔒';
  };

  const getStatusText = () => {
    if (place.isCompleted) return t('placeStatus.completed');
    if (place.isUnlocked) return t('placeStatus.unlocked');
    return t('placeStatus.locked');
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isActive && styles.activeContainer,
        place.isCompleted && styles.completedContainer,
      ]}
      onPress={onPress}
      disabled={place.isCompleted}
      activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.orderContainer}>
          <Text style={styles.orderText}>{place.order}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>
            {place.name}
          </Text>
          {place.description?.trim() ? (
            <Text style={styles.description} numberOfLines={2}>
              {place.description}
            </Text>
          ) : null}
        </View>
        <View style={styles.statusContainer}>
          <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      {place.distance !== undefined && place.isUnlocked && (
        <View style={styles.footer}>
          <Text style={styles.distanceText}>
            {t('game.distanceAway', {
              distance: formatDistance(place.distance),
            })}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
  },
  activeContainer: {
    borderColor: colors.primary,
    backgroundColor: colors.infoLight,
  },
  completedContainer: {
    borderColor: colors.completed,
    backgroundColor: colors.successLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  orderContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  orderText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.background,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  statusContainer: {
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  statusIcon: {
    fontSize: fontSize.lg,
    marginBottom: spacing.xs,
  },
  statusText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  footer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  distanceText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
});
