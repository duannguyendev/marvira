import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Event } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { formatDistance } from '../utils/distance';
import { FavoriteButton } from './FavoriteButton';
import { CoverImage } from './CoverImage';

interface EventCardProps {
  event: Event;
  onPress: () => void;
  isFavorite?: boolean;
  onFavoritePress?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onPress,
  isFavorite,
  onFavoritePress,
}) => {
  const { t } = useTranslation();
  const isIncoming = !!event.isIncoming;

  const startWhen = event.scheduledPublishAt
    ? new Date(event.scheduledPublishAt).toLocaleString()
    : '';

  const body = (
    <>
      <CoverImage uri={event.imageUrl} style={styles.image} />
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
          {isIncoming ? (
            <View
              style={[styles.statusBadge, { backgroundColor: colors.info }]}>
              <Text style={styles.statusText}>
                {t('eventStatus.incoming')}
              </Text>
            </View>
          ) : null}
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

          {isIncoming ? (
            <Text style={styles.incomingHint}>{t('events.incomingHint')}</Text>
          ) : (
            <View style={styles.metaEnd}>
              {event.totalPlaces > 0 ? (
                <Text style={styles.placesText}>
                  {event.totalPlaces} {t('common.places')}
                </Text>
              ) : null}
              {event.creatorName ? (
                <Text style={styles.creatorText} numberOfLines={1}>
                  {t('events.createdBy', { name: event.creatorName })}
                </Text>
              ) : null}
            </View>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
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
  placesText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    textAlign: 'right',
  },
  metaEnd: {
    flex: 1,
    marginLeft: spacing.md,
    alignItems: 'flex-end',
  },
  creatorText: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'right',
  },
});
