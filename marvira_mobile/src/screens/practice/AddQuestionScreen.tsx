import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { appAlert } from '../../utils/appAlert';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { QuestionForm } from '../../components/QuestionForm';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import {
  useCreatePracticeQuestion,
  usePracticeQuestion,
  useUpdatePracticeQuestion,
} from '../../hooks/usePractice';
import { CreateQuestionInput } from '../../types';
import {
  PracticeStackParamList,
  ProfileStackParamList,
} from '../../navigation/types';
import { uploadsApi } from '../../api/uploads';
import { getAppContentLanguage } from '../../services/contentLanguage';
import { colors, spacing, fontSize, fontWeight } from '../../theme';

type AddQuestionRoute =
  | RouteProp<PracticeStackParamList, 'AddQuestion'>
  | RouteProp<ProfileStackParamList, 'AddQuestion'>;

type AddQuestionNavigation =
  | NativeStackNavigationProp<PracticeStackParamList, 'AddQuestion'>
  | NativeStackNavigationProp<ProfileStackParamList, 'AddQuestion'>;

const DEFAULT_QUESTION: CreateQuestionInput = {
  question: '',
  type: 'TEXT',
  answer: '',
  points: 10,
};

export const AddQuestionScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<AddQuestionRoute>();
  const navigation = useNavigation<AddQuestionNavigation>();
  const questionId = route.params?.questionId;

  const [question, setQuestion] =
    useState<CreateQuestionInput>(DEFAULT_QUESTION);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const { data: existingData, isLoading: loadingExisting } =
    usePracticeQuestion(questionId ?? '');
  const createMutation = useCreatePracticeQuestion();
  const updateMutation = useUpdatePracticeQuestion();

  const isEditing = !!questionId;

  useEffect(() => {
    if (existingData?.data) {
      const q = existingData.data;
      setQuestion({
        question: q.text,
        type: q.type,
        answer: q.answer ?? '',
        options: q.options,
        points: q.points,
        imageUrl: q.imageUrl,
        language: q.language ?? getAppContentLanguage(),
      });
    }
  }, [existingData]);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (question.question.trim().length < 3) {
      nextErrors.question = t('createEvent.validation.questionMin');
    }
    if (question.type !== 'TRUE_FALSE' && question.answer.trim().length < 1) {
      nextErrors.answer = t('createEvent.validation.answerRequired');
    }
    if (question.type === 'IMAGE' && !question.imageUrl?.trim()) {
      nextErrors.imageUrl = t('createEvent.validation.imageRequired');
    }
    if (question.type === 'MULTIPLE_CHOICE') {
      const options = (question.options ?? [])
        .map(o => o.trim())
        .filter(Boolean);
      if (options.length < 2) {
        nextErrors.options = t('createEvent.validation.optionsMin');
      } else if (
        !options.some(
          o => o.toLowerCase() === question.answer.trim().toLowerCase(),
        )
      ) {
        nextErrors.answer = t('createEvent.validation.answerMustMatchOption');
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    try {
      setUploading(true);
      let imageUrl = question.imageUrl;
      if (question.type === 'IMAGE') {
        imageUrl = await uploadsApi.ensureRemoteImageUrl(question.imageUrl);
        if (!imageUrl) {
          throw new Error(t('createEvent.imageUploadFailed'));
        }
      }

      const payload: CreateQuestionInput = {
        ...question,
        question: question.question.trim(),
        answer: question.answer.trim(),
        imageUrl: question.type === 'IMAGE' ? imageUrl : undefined,
        language: question.language ?? getAppContentLanguage(),
        options:
          question.type === 'MULTIPLE_CHOICE'
            ? (question.options ?? []).map(o => o.trim()).filter(Boolean)
            : undefined,
      };

      if (isEditing && questionId) {
        await updateMutation.mutateAsync({ questionId, input: payload });
        appAlert.alert(
          t('practice.updateSuccessTitle'),
          t('practice.updateSuccessMessage'),
          [{ text: t('common.ok'), onPress: () => navigation.goBack() }],
        );
      } else {
        await createMutation.mutateAsync(payload);
        appAlert.alert(
          t('practice.createSuccessTitle'),
          t('practice.createSuccessMessage'),
          [{ text: t('common.ok'), onPress: () => navigation.goBack() }],
        );
      }
    } catch (err: unknown) {
      appAlert.alert(
        t('common.error'),
        (err as Error)?.message || t('practice.saveFailed'),
      );
    } finally {
      setUploading(false);
    }
  };

  if (isEditing && loadingExisting) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>
        {isEditing ? t('practice.editQuestion') : t('practice.addQuestion')}
      </Text>
      <Text style={styles.subheading}>
        {t('practice.addQuestionSubheading')}
      </Text>

      <View style={styles.formCard}>
        <QuestionForm value={question} onChange={setQuestion} errors={errors} />
      </View>

      <Button
        title={
          isEditing ? t('practice.saveQuestion') : t('practice.publishQuestion')
        }
        onPress={handleSubmit}
        loading={
          uploading || createMutation.isPending || updateMutation.isPending
        }
        fullWidth
      />
    </ScrollView>
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
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
});
