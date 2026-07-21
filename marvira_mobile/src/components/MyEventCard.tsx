import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import {MyCreatedEvent} from '../types';
import {colors, spacing, borderRadius, fontSize, fontWeight} from '../theme';

interface MyEventCardProps {
  event: MyCreatedEvent;
  onPress: () => void;
}

export const MyEventCard: React.FC<MyEventCardProps> = ({event, onPress}) => {
  const {t} = useTranslation();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}>
      {event.imageUrl ? (
        <Image source={{uri: event.imageUrl}} style={styles.image} />
      ) : (
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.image}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
        />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>
          <View
            style={[
              styles.badge,
              event.isPublished ? styles.publishedBadge : styles.draftBadge,
            ]}>
            <Text style={styles.badgeText}>
              {event.isPublished
                ? t('myEvents.published')
                : t('myEvents.draft')}
            </Text>
          </View>
        </View>
        <Text style={styles.meta}>
          {event.city} · {t(`createEvent.difficulties.${event.difficulty}`)} ·{' '}
          {event.totalPlaces} {t('common.places')}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {event.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  image: {
    height: 120,
    width: '100%',
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  publishedBadge: {
    backgroundColor: colors.successLight,
  },
  draftBadge: {
    backgroundColor: colors.warningLight,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textDark,
  },
  meta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
