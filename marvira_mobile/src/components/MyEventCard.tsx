import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MyCreatedEvent } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { CoverImage } from './CoverImage';

interface MyEventCardProps {
  event: MyCreatedEvent;
  onPress: () => void;
  onFinishersPress?: () => void;
  onEditCoverPress?: () => void;
  onEditGiftsPress?: () => void;
  onEditAnswersPress?: () => void;
  onCancelSchedulePress?: () => void;
  onReschedulePress?: () => void;
  onContinuePublishPress?: () => void;
  onDeletePress?: () => void;
  onEndPress?: () => void;
}

export const MyEventCard: React.FC<MyEventCardProps> = ({
  event,
  onPress,
  onFinishersPress,
  onEditCoverPress,
  onEditGiftsPress,
  onEditAnswersPress,
  onCancelSchedulePress,
  onReschedulePress,
  onContinuePublishPress,
  onDeletePress,
  onEndPress,
}) => {
  const { t } = useTranslation();
  const status = event.lifecycleStatus;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}>
      <CoverImage uri={event.imageUrl} style={styles.image} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>
          <View
            style={[
              styles.badge,
              status === 'published'
                ? styles.publishedBadge
                : status === 'scheduled'
                  ? styles.scheduledBadge
                  : status === 'done'
                    ? styles.doneBadge
                    : styles.draftBadge,
            ]}>
            <Text style={styles.badgeText}>
              {t(`myEvents.${status}`)}
            </Text>
          </View>
        </View>
        {status === 'scheduled' && event.scheduledPublishAt ? (
          <Text style={styles.scheduleLine}>
            {t('myEvents.goesLive', {
              when: new Date(event.scheduledPublishAt).toLocaleString(),
            })}
          </Text>
        ) : null}
        {status === 'published' && event.endsAt ? (
          <Text style={styles.scheduleLine}>
            {t('myEvents.endsAt', {
              when: new Date(event.endsAt).toLocaleString(),
            })}
          </Text>
        ) : null}
        {status === 'done' && event.endedAt ? (
          <Text style={styles.endedLine}>
            {t('myEvents.endedAt', {
              when: new Date(event.endedAt).toLocaleString(),
            })}
          </Text>
        ) : null}
        <Text style={styles.meta}>
          {event.city} · {t(`createEvent.difficulties.${event.difficulty}`)} ·{' '}
          {event.totalPlaces} {t('common.places')}
          {event.hasGift ? ` · 🎁 ${t('events.giftLabel')}` : ''}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {event.description}
        </Text>
        <View style={styles.actions}>
          {(status === 'draft' || status === 'scheduled') &&
          onContinuePublishPress ? (
            <TouchableOpacity
              onPress={e => {
                e.stopPropagation?.();
                onContinuePublishPress();
              }}
              style={styles.actionLink}
              accessibilityRole="button">
              <Text style={styles.actionLinkText}>
                {status === 'scheduled'
                  ? t('myEvents.managePublish')
                  : t('myEvents.continuePublish')}
              </Text>
            </TouchableOpacity>
          ) : null}
          {status === 'scheduled' && onReschedulePress ? (
            <TouchableOpacity
              onPress={e => {
                e.stopPropagation?.();
                onReschedulePress();
              }}
              style={styles.actionLink}
              accessibilityRole="button">
              <Text style={styles.actionLinkText}>
                {t('myEvents.reschedule')}
              </Text>
            </TouchableOpacity>
          ) : null}
          {status === 'scheduled' && onCancelSchedulePress ? (
            <TouchableOpacity
              onPress={e => {
                e.stopPropagation?.();
                onCancelSchedulePress();
              }}
              style={styles.actionLink}
              accessibilityRole="button">
              <Text style={styles.actionLinkText}>
                {t('myEvents.cancelSchedule')}
              </Text>
            </TouchableOpacity>
          ) : null}
          {status !== 'done' && onEditCoverPress ? (
            <TouchableOpacity
              onPress={e => {
                e.stopPropagation?.();
                onEditCoverPress();
              }}
              style={styles.actionLink}
              accessibilityRole="button">
              <Text style={styles.actionLinkText}>
                {t('myEvents.editCover')}
              </Text>
            </TouchableOpacity>
          ) : null}
          {status !== 'done' && onEditAnswersPress ? (
            <TouchableOpacity
              onPress={e => {
                e.stopPropagation?.();
                onEditAnswersPress();
              }}
              style={styles.actionLink}
              accessibilityRole="button">
              <Text style={styles.actionLinkText}>
                {t('myEvents.editAnswers')}
              </Text>
            </TouchableOpacity>
          ) : null}
          {status !== 'done' && onEditGiftsPress ? (
            <TouchableOpacity
              onPress={e => {
                e.stopPropagation?.();
                onEditGiftsPress();
              }}
              style={styles.actionLink}
              accessibilityRole="button">
              <Text style={styles.actionLinkText}>
                {t('myEvents.editGifts')}
              </Text>
            </TouchableOpacity>
          ) : null}
          {(status === 'published' || status === 'done') &&
          onFinishersPress ? (
            <TouchableOpacity
              onPress={e => {
                e.stopPropagation?.();
                onFinishersPress();
              }}
              style={styles.actionLink}
              accessibilityRole="button">
              <Text style={styles.actionLinkText}>
                {t('myEvents.viewFinishers')}
              </Text>
            </TouchableOpacity>
          ) : null}
          {status === 'published' && onEndPress ? (
            <TouchableOpacity
              onPress={e => {
                e.stopPropagation?.();
                onEndPress();
              }}
              style={styles.actionLink}
              accessibilityRole="button">
              <Text style={[styles.actionLinkText, styles.endLinkText]}>
                {t('myEvents.endEvent')}
              </Text>
            </TouchableOpacity>
          ) : null}
          {(status === 'draft' || status === 'scheduled') && onDeletePress ? (
            <TouchableOpacity
              onPress={e => {
                e.stopPropagation?.();
                onDeletePress();
              }}
              style={styles.actionLink}
              accessibilityRole="button">
              <Text style={[styles.actionLinkText, styles.deleteLinkText]}>
                {t('myEvents.deleteDraft')}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
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
    shadowOffset: { width: 0, height: 2 },
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
  scheduledBadge: {
    backgroundColor: colors.infoLight,
  },
  doneBadge: {
    backgroundColor: colors.backgroundGray,
  },
  scheduleLine: {
    fontSize: fontSize.sm,
    color: colors.info,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  endedLine: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
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
  actions: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionLink: {
    alignSelf: 'flex-start',
  },
  actionLinkText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  deleteLinkText: {
    color: colors.error,
  },
  endLinkText: {
    color: colors.error,
  },
});
