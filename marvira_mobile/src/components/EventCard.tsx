import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import { Event } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { formatDistance } from '../utils/distance';
import { FavoriteButton } from './FavoriteButton';

interface EventCardProps {
  event: Event;
  onPress: () => void;
  isFavorite?: boolean;
  onFavoritePress?: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.lg * 2;

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onPress,
  isFavorite,
  onFavoritePress,
}) => {
  const { t } = useTranslation();
  const isIncoming = !!event.isIncoming;

  const getStatusColor = () => {
    if (isIncoming) {
      return colors.info;
    }
    switch (event.status) {
      case 'completed':
        return colors.completed;
      case 'in_progress':
        return colors.inProgress;
      default:
        return colors.notStarted;
    }
  };

  const progress = event.totalPlaces
    ? (event.completedPlaces / event.totalPlaces) * 100
    : 0;

  const startWhen = event.scheduledPublishAt
    ? new Date(event.scheduledPublishAt).toLocaleString()
    : '';

  const body = (
    <>
      {event.imageUrl ? (
        <Image source={{ uri: event.imageUrl }} style={styles.image} />
      ) : (
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.image}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      {!isIncoming && onFavoritePress ? (
        <FavoriteButton
          isFavorite={!!isFavorite}
          onPress={onFavoritePress}
          style={styles.favoriteButton}
        />
      ) : null}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {event.title}
            </Text>
            {event.isPasswordProtected ? (
              <View style={styles.lockBadge}>
                <Text style={styles.lockBadgeText}>🔒</Text>
              </View>
            ) : null}
            {event.hasGift ? (
              <View
                style={styles.giftBadge}
                accessibilityLabel={t('events.giftLabel')}>
                <Text style={styles.giftBadgeText}>🎁</Text>
              </View>
            ) : null}
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>
              {isIncoming
                ? t('eventStatus.incoming')
                : t(`eventStatus.${event.status}`)}
            </Text>
          </View>
        </View>

        {isIncoming && startWhen ? (
          <Text style={styles.incomingLine}>
            {t('events.startsAt', { when: startWhen })}
          </Text>
        ) : null}

        <Text style={styles.description} numberOfLines={2}>
          {event.description}
        </Text>

        <View style={styles.footer}>
          {event.distance !== undefined && (
            <View style={styles.distanceContainer}>
              <Text style={styles.distanceIcon}>📍</Text>
              <Text style={styles.distanceText}>
                {formatDistance(event.distance)}
              </Text>
            </View>
          )}

          {!isIncoming ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress}%`,
                      backgroundColor: getStatusColor(),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {event.completedPlaces}/{event.totalPlaces} {t('common.places')}
              </Text>
            </View>
          ) : (
            <Text style={styles.incomingHint}>{t('events.incomingHint')}</Text>
          )}
        </View>
      </View>
    </>
  );

  if (isIncoming) {
    return (
      <View
        style={[styles.container, styles.incomingContainer]}
        accessibilityState={{ disabled: true }}
        accessibilityHint={t('events.incomingHint')}>
        {body}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}>
      {body}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  incomingContainer: {
    opacity: 0.92,
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: borderRadius.round,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: colors.backgroundGray,
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
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginRight: spacing.sm,
  },
  lockBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  lockBadgeText: {
    fontSize: fontSize.sm,
  },
  giftBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  giftBadgeText: {
    fontSize: fontSize.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  statusText: {
    fontSize: fontSize.xs,
    color: colors.background,
    fontWeight: fontWeight.semibold,
  },
  incomingLine: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.info,
    marginBottom: spacing.sm,
  },
  incomingHint: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceIcon: {
    fontSize: fontSize.sm,
    marginRight: spacing.xs,
  },
  distanceText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  progressContainer: {
    flex: 1,
    marginLeft: spacing.md,
    alignItems: 'flex-end',
  },
  progressBar: {
    width: 100,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  progressText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
