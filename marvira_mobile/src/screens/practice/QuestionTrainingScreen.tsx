import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  usePracticeQuestion,
  useSubmitTrainingAnswer,
} from '../../hooks/usePractice';
import { useIsQuestionFavorite } from '../../hooks/useFavorites';
import { useFavoriteQuestionToggle } from '../../hooks/useFavoriteQuestionToggle';
import { QuestionRenderer } from '../../components/QuestionRenderer';
import { FavoriteButton } from '../../components/FavoriteButton';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorView } from '../../components/ErrorView';
import { UnfavoriteConfirmBottomSheet } from '../../components/UnfavoriteConfirmBottomSheet';
import {
  PracticeStackParamList,
  FavoritesStackParamList,
} from '../../navigation/types';
import { AnalyticsEvents } from '../../services/analytics';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '../../theme';

type TrainingRoute =
  | RouteProp<PracticeStackParamList, 'QuestionTraining'>
  | RouteProp<FavoritesStackParamList, 'QuestionTraining'>;

type TrainingNavigation =
  | NativeStackNavigationProp<PracticeStackParamList, 'QuestionTraining'>
  | NativeStackNavigationProp<FavoritesStackParamList, 'QuestionTraining'>;

export const QuestionTrainingScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<TrainingRoute>();
  const navigation = useNavigation<TrainingNavigation>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { questionId } = route.params;

  const [answer, setAnswer] = useState('');
  const { data, isLoading, error, refetch } = usePracticeQuestion(questionId);
  const submitMutation = useSubmitTrainingAnswer();
  const { data: isFavorite } = useIsQuestionFavorite(questionId);
  const {
    pendingUnfavoriteId,
    onFavoritePress,
    confirmUnfavorite,
    cancelUnfavorite,
  } = useFavoriteQuestionToggle();

  const question = data?.data;
  const favorited = isFavorite ?? false;

  useEffect(() => {
    void AnalyticsEvents.practiceOpened('training');
  }, [questionId]);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      Alert.alert(t('game.enterAnswer'));
      return;
    }

    try {
      const result = await submitMutation.mutateAsync({
        questionId,
        submission: { answer },
      });

      void AnalyticsEvents.practiceAnswered(
        questionId,
        result.data.isCorrect,
      );

      if (result.data.isCorrect) {
        Alert.alert(
          t('practice.correctTitle'),
          result.data.explanation || t('practice.correctMessage'),
          [
            {
              text: t('common.ok'),
              onPress: () => navigation.goBack(),
            },
          ],
        );
      } else {
        Alert.alert(
          t('practice.incorrectTitle'),
          t('practice.incorrectMessage'),
        );
      }
    } catch (err: unknown) {
      Alert.alert(
        t('common.error'),
        (err as Error)?.message || t('practice.submitFailed'),
      );
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error || !question) {
    return (
      <ErrorView
        message={(error as Error)?.message || t('practice.questionLoadFailed')}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.badge}>{t('practice.trainingMode')}</Text>
            <Text style={styles.hint}>{t('practice.trainingHint')}</Text>
          </View>
          <FavoriteButton
            isFavorite={favorited}
            onPress={() => onFavoritePress(questionId, favorited)}
            accessibilityLabel={
              favorited
                ? t('favorites.unfavoriteQuestionA11y')
                : t('favorites.favoriteQuestionA11y')
            }
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.questionLabel}>{t('game.question')}</Text>
          <QuestionRenderer
            question={{
              id: question.id,
              text: question.text,
              type: question.type,
              imageUrl: question.imageUrl,
              options: question.options,
              points: question.points,
            }}
            answer={answer}
            onChangeAnswer={setAnswer}
          />
        </View>
      </ScrollView>

      <View
        style={[
          styles.submitFooter,
          { paddingBottom: Math.max(insets.bottom, spacing.md) },
        ]}>
        <Button
          title={t('practice.submitTraining')}
          onPress={handleSubmit}
          loading={submitMutation.isPending}
          fullWidth
          disabled={!answer.trim()}
        />
      </View>

      <UnfavoriteConfirmBottomSheet
        visible={pendingUnfavoriteId !== null}
        title={t('favorites.unfavoriteQuestionTitle')}
        message={t('favorites.unfavoriteQuestionMessage')}
        onCancel={cancelUnfavorite}
        onConfirm={confirmUnfavorite}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerText: {
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  questionLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textDark,
    marginBottom: spacing.md,
  },
  submitFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
});
