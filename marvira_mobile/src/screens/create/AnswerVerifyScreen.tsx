import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { appAlert } from '../../utils/appAlert';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StepIndicator } from '../../components/StepIndicator';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorView } from '../../components/ErrorView';
import { VerifyQuestionRenderer } from '../../components/VerifyQuestionRenderer';
import {
  usePublishVerifyQuestions,
  usePublishVerifyStatus,
  useSubmitPublishVerify,
} from '../../hooks/usePublishVerify';
import { HomeStackParamList } from '../../navigation/types';
import { PlaceQuestion } from '../../types';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '../../theme';

type AnswerVerifyRouteProp = RouteProp<HomeStackParamList, 'AnswerVerify'>;

type NavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  'AnswerVerify'
>;

const STEP_LABELS = ['info', 'places', 'review', 'done'];

function toPlaceQuestion(item: {
  question: {
    id: string;
    question: string;
    type: PlaceQuestion['type'];
    imageUrl?: string | null;
    options?: string[] | null;
    points: number;
  };
}): PlaceQuestion {
  return {
    id: item.question.id,
    text: item.question.question,
    type: item.question.type,
    imageUrl: item.question.imageUrl ?? undefined,
    options: (item.question.options as string[] | undefined) ?? undefined,
    points: item.question.points,
  };
}

export const AnswerVerifyScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<AnswerVerifyRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { eventId, returnAction } = route.params;

  const {
    data: questions,
    isLoading: questionsLoading,
    error: questionsError,
    refetch: refetchQuestions,
  } = usePublishVerifyQuestions(eventId);
  const { data: status, refetch: refetchStatus } = usePublishVerifyStatus(
    eventId,
  );
  const submitVerify = useSubmitPublishVerify(eventId);

  const pendingItems = useMemo(
    () => (questions ?? []).filter(item => !item.verified),
    [questions],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');

  const currentItem = pendingItems[currentIndex];
  const verifiedCount = status?.verifiedCount ?? 0;
  const totalCount = status?.totalCount ?? questions?.length ?? 0;

  const handleSubmit = async () => {
    if (!currentItem) {
      return;
    }
    if (!answer.trim()) {
      appAlert.alert(t('common.error'), t('createEvent.verify.answerRequired'), undefined, {
        dismissOnOverlayPress: true,
      });
      return;
    }

    try {
      const result = await submitVerify.mutateAsync({
        questionId: currentItem.question.id,
        answer: answer.trim(),
      });
      await refetchStatus();

      if (!result.correct) {
        appAlert.alert(
          t('createEvent.verify.mismatchTitle'),
          t('createEvent.verify.mismatchMessage'),
          [
            {
              text: t('createEvent.verify.editAnswer'),
              onPress: () =>
                navigation.navigate('EditEventAnswers', {
                  eventId,
                  returnToVerify: true,
                }),
            },
            { text: t('createEvent.verify.retry'), style: 'cancel' },
          ],
        );
        setAnswer('');
        return;
      }

      setAnswer('');
      if (result.verifiedCount >= result.totalCount) {
        navigation.navigate('CreateEventReview', {
          eventId,
          verifyComplete: true,
          returnAction,
        });
        return;
      }

      setCurrentIndex(0);
      await refetchQuestions();
    } catch (err: any) {
      appAlert.alert(
        t('common.error'),
        err?.response?.data?.message || err.message || t('common.error'),
      );
    }
  };

  const handleSkipToReview = () => {
    navigation.navigate('CreateEventReview', { eventId, returnAction });
  };

  if (questionsLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (questionsError || !questions) {
    return (
      <ErrorView
        message={(questionsError as Error)?.message || t('common.error')}
        onRetry={() => refetchQuestions()}
      />
    );
  }

  if (status?.allVerified) {
    return (
      <View style={styles.container}>
        <View style={styles.completeCard}>
          <Text style={styles.completeTitle}>
            {t('createEvent.verify.allDoneTitle')}
          </Text>
          <Text style={styles.completeMessage}>
            {t('createEvent.verify.allDoneMessage')}
          </Text>
          <Button
            title={t('createEvent.verify.backToReview')}
            onPress={() =>
              navigation.navigate('CreateEventReview', {
                eventId,
                verifyComplete: true,
                returnAction,
              })
            }
            fullWidth
          />
        </View>
      </View>
    );
  }

  if (!currentItem) {
    return <LoadingSpinner fullScreen />;
  }

  const placeQuestion = toPlaceQuestion(currentItem);

  return (
    <View style={styles.container}>
      <StepIndicator
        currentStep={3}
        totalSteps={4}
        labels={STEP_LABELS.map(key => t(`createEvent.steps.${key}`))}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>{t('createEvent.verify.heading')}</Text>
        <Text style={styles.subheading}>
          {t('createEvent.verify.subheading')}
        </Text>

        <View style={styles.progressCard}>
          <Text style={styles.progressText}>
            {t('createEvent.verify.progress', {
              verified: verifiedCount,
              total: totalCount,
            })}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width:
                    totalCount > 0
                      ? `${(verifiedCount / totalCount) * 100}%`
                      : '0%',
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.placeHeader}>
          <Text style={styles.placeTitle}>
            {currentItem.placeOrderIndex + 1}. {currentItem.placeTitle}
          </Text>
          {currentItem.verified ? (
            <Text style={styles.verifiedBadge}>
              {t('createEvent.verify.verified')}
            </Text>
          ) : null}
        </View>

        <View style={styles.questionCard}>
          <VerifyQuestionRenderer
            key={placeQuestion.id}
            question={placeQuestion}
            answer={answer}
            onChangeAnswer={setAnswer}
          />
        </View>

        <Button
          title={t('createEvent.verify.checkAnswer')}
          onPress={handleSubmit}
          loading={submitVerify.isPending}
          fullWidth
          style={styles.button}
        />

        <TouchableOpacity onPress={handleSkipToReview} style={styles.linkRow}>
          <Text style={styles.linkText}>
            {t('createEvent.verify.saveAndResume')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  heading: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  subheading: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  progressCard: {
    backgroundColor: colors.infoLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  progressText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  placeTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textDark,
    flex: 1,
  },
  verifiedBadge: {
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: fontWeight.semibold,
  },
  questionCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.sm,
  },
  linkRow: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  linkText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  completeCard: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  completeTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  completeMessage: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
});
