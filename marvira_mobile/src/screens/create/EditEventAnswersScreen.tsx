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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorView } from '../../components/ErrorView';
import { QuestionForm } from '../../components/QuestionForm';
import { Button } from '../../components/Button';
import { eventOwnerApi } from '../../api/eventOwner';
import { CreateQuestionInput } from '../../types';
import { HomeStackParamList } from '../../navigation/types';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '../../theme';

type Route = RouteProp<HomeStackParamList, 'EditEventAnswers'>;
type Nav = NativeStackNavigationProp<HomeStackParamList, 'EditEventAnswers'>;

export const EditEventAnswersScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const { eventId, returnToVerify } = route.params;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ownerPlaces', eventId],
    queryFn: () => eventOwnerApi.getOwnerPlaces(eventId),
  });

  const { data: reports } = useQuery({
    queryKey: ['answerReports', eventId],
    queryFn: () => eventOwnerApi.getAnswerReports(eventId),
  });

  const reportByPlace = useMemo(() => {
    const map = new Map<
      string,
      { reporterCount: number; lastReportedAt: string | null }
    >();
    for (const r of reports ?? []) {
      map.set(r.placeId, {
        reporterCount: r.reporterCount,
        lastReportedAt: r.lastReportedAt,
      });
    }
    return map;
  }, [reports]);

  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [question, setQuestion] = useState<CreateQuestionInput | null>(null);

  const updateMutation = useMutation({
    mutationFn: ({
      questionId,
      input,
    }: {
      questionId: string;
      input: Partial<CreateQuestionInput>;
    }) => eventOwnerApi.updateQuestion(questionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerPlaces', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({
        queryKey: ['publishVerifyStatus', eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ['publishVerifyQuestions', eventId],
      });
      queryClient.invalidateQueries({ queryKey: ['answerReports', eventId] });
      appAlert.alert(
        t('createEvent.editAnswers.savedTitle'),
        t('createEvent.editAnswers.savedMessage'),
      );
      setSelectedPlaceId(null);
      setQuestion(null);
      if (returnToVerify) {
        navigation.navigate('AnswerVerify', { eventId, returnAction: 'publish' });
      }
    },
    onError: (err: Error) => {
      appAlert.alert(t('common.error'), err.message);
    },
  });

  const selectPlace = (placeId: string) => {
    const place = data?.find(p => p.id === placeId);
    if (!place?.question) return;
    setSelectedPlaceId(placeId);
    setQuestion({
      question: place.question.question,
      type: place.question.type,
      answer: place.question.answer,
      options: place.question.options ?? undefined,
      imageUrl: place.question.imageUrl ?? undefined,
      points: place.question.points,
    });
  };

  const handleSave = () => {
    const place = data?.find(p => p.id === selectedPlaceId);
    if (!place?.question || !question) return;
    updateMutation.mutate({
      questionId: place.question.id,
      input: question,
    });
  };

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (error || !data) {
    return (
      <ErrorView
        message={(error as Error)?.message || t('common.error')}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t('createEvent.editAnswers.heading')}</Text>
      <Text style={styles.subheading}>
        {t('createEvent.editAnswers.subheading')}
      </Text>

      {data.map((place, index) => {
        const report = reportByPlace.get(place.id);
        return (
          <TouchableOpacity
            key={place.id}
            style={[
              styles.placeCard,
              selectedPlaceId === place.id && styles.placeCardActive,
            ]}
            onPress={() => selectPlace(place.id)}>
            <Text style={styles.placeTitle}>
              {index + 1}. {place.title}
            </Text>
            {place.question?.answerUpdatedAt ? (
              <Text style={styles.updatedTag}>
                {t('createEvent.editAnswers.updatedTag')}
              </Text>
            ) : null}
            {report && report.reporterCount > 0 ? (
              <Text style={styles.reportTag}>
                {t('createEvent.editAnswers.reportCount', {
                  count: report.reporterCount,
                })}
              </Text>
            ) : null}
          </TouchableOpacity>
        );
      })}

      {selectedPlaceId && question ? (
        <View style={styles.editor}>
          <QuestionForm value={question} onChange={setQuestion} />
          <Button
            title={t('createEvent.editAnswers.save')}
            onPress={handleSave}
            loading={updateMutation.isPending}
            fullWidth
          />
        </View>
      ) : null}

      <Button
        title={t('game.goBack')}
        variant="outline"
        onPress={() => navigation.goBack()}
        fullWidth
        style={styles.back}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
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
  placeCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeCardActive: {
    borderColor: colors.primary,
  },
  placeTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textDark,
  },
  updatedTag: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.info,
    fontWeight: fontWeight.medium,
  },
  reportTag: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.error,
    fontWeight: fontWeight.semibold,
  },
  editor: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  back: { marginTop: spacing.sm },
});
