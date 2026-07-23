import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PracticeQuestionListItem } from '../types';
import { FavoriteButton } from './FavoriteButton';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

interface PracticeQuestionCardProps {
  question: PracticeQuestionListItem;
  onPress: () => void;
  onFavoritePress: () => void;
  showSource?: boolean;
}

export const PracticeQuestionCard: React.FC<PracticeQuestionCardProps> = ({
  question,
  onPress,
  onFavoritePress,
  showSource = true,
}) => {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.85}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.questionText} numberOfLines={2}>
            {question.text}
          </Text>
          {showSource ? (
            <Text style={styles.meta}>
              {question.source === 'event'
                ? t('practice.sourceEvent', {
                    event: question.eventTitle ?? '',
                  })
                : t('practice.sourceCommunity')}{' '}
              · {question.authorName}
            </Text>
          ) : (
            <Text style={styles.meta}>{question.authorName}</Text>
          )}
        </View>
        <FavoriteButton
          isFavorite={question.isFavorite}
          onPress={onFavoritePress}
          accessibilityLabel={
            question.isFavorite
              ? t('favorites.unfavoriteQuestionA11y')
              : t('favorites.favoriteQuestionA11y')
          }
        />
      </View>
      <View style={styles.footer}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>
            {t(`createEvent.questionTypes.${question.type}`)}
          </Text>
        </View>
        <Text style={styles.points}>
          {question.points} {t('common.pts')}
        </Text>
        {question.isTrainingCompleted ? (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>{t('practice.completed')}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
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
  questionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textDark,
    marginBottom: spacing.xs,
    lineHeight: 22,
  },
  meta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  typeBadge: {
    backgroundColor: colors.backgroundGray,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  typeText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  points: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  completedBadge: {
    backgroundColor: colors.completed,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginLeft: 'auto',
  },
  completedText: {
    fontSize: fontSize.xs,
    color: colors.background,
    fontWeight: fontWeight.semibold,
  },
});
