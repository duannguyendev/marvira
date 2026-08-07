import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StepIndicator } from '../../components/StepIndicator';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useCreateEvent } from '../../hooks/useMyEvents';
import { CreateEventInput, EventDifficulty } from '../../types';
import { HomeStackParamList } from '../../navigation/types';
import { AnalyticsEvents, analytics } from '../../services/analytics';
import { getAppContentLanguage } from '../../services/contentLanguage';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '../../theme';

type NavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  'CreateEventInfo'
>;

const DIFFICULTIES: EventDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];

const STEP_LABELS = ['info', 'places', 'review', 'done'];

export const CreateEventInfoScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const createEvent = useCreateEvent();

  const [form, setForm] = useState<CreateEventInput>({
    title: '',
    description: '',
    city: '',
    difficulty: 'MEDIUM',
    rewardPoints: 100,
    language: getAppContentLanguage(),
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateEventInput, string>>
  >({});

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof CreateEventInput, string>> = {};
    if (form.title.trim().length < 3) {
      nextErrors.title = t('createEvent.validation.titleMin');
    }
    if (form.description.trim().length < 10) {
      nextErrors.description = t('createEvent.validation.descriptionMin');
    }
    if (form.city.trim().length < 2) {
      nextErrors.city = t('createEvent.validation.cityMin');
    }
    if (
      !Number.isFinite(form.rewardPoints) ||
      form.rewardPoints < 0 ||
      form.rewardPoints > 1000
    ) {
      nextErrors.rewardPoints = t('createEvent.validation.rewardPoints');
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) {
      return;
    }

    try {
      const result = await createEvent.mutateAsync({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        city: form.city.trim(),
      });
      void AnalyticsEvents.eventDraftCreated(result.data.id);
      navigation.navigate('CreateEventPlace', {
        eventId: result.data.id,
        placeIndex: 0,
      });
    } catch (error: any) {
      analytics.recordError(error);
      Alert.alert(
        t('common.error'),
        error?.response?.data?.message ||
          error.message ||
          t('createEvent.createFailed'),
      );
    }
  };

  return (
    <View style={styles.container}>
      <StepIndicator
        currentStep={1}
        totalSteps={4}
        labels={STEP_LABELS.map(key => t(`createEvent.steps.${key}`))}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>{t('createEvent.infoHeading')}</Text>
        <Text style={styles.subheading}>{t('createEvent.infoSubheading')}</Text>

        <Input
          label={t('createEvent.title')}
          value={form.title}
          onChangeText={title => setForm(prev => ({ ...prev, title }))}
          placeholder={t('createEvent.titlePlaceholder')}
          error={errors.title}
        />
        <Input
          label={t('createEvent.description')}
          value={form.description}
          onChangeText={description =>
            setForm(prev => ({ ...prev, description }))
          }
          placeholder={t('createEvent.descriptionPlaceholder')}
          multiline
          error={errors.description}
        />
        <Input
          label={t('createEvent.city')}
          value={form.city}
          onChangeText={city => setForm(prev => ({ ...prev, city }))}
          placeholder={t('createEvent.cityPlaceholder')}
          error={errors.city}
        />

        <Text style={styles.label}>{t('createEvent.difficulty')}</Text>
        <View style={styles.difficultyRow}>
          {DIFFICULTIES.map(difficulty => (
            <TouchableOpacity
              key={difficulty}
              style={[
                styles.difficultyButton,
                form.difficulty === difficulty && styles.difficultyButtonActive,
              ]}
              onPress={() => setForm(prev => ({ ...prev, difficulty }))}>
              <Text
                style={[
                  styles.difficultyText,
                  form.difficulty === difficulty && styles.difficultyTextActive,
                ]}>
                {t(`createEvent.difficulties.${difficulty}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label={t('createEvent.rewardPoints')}
          value={String(form.rewardPoints)}
          onChangeText={value =>
            setForm(prev => ({
              ...prev,
              rewardPoints: parseInt(value || '0', 10) || 0,
            }))
          }
          keyboardType="number-pad"
          error={errors.rewardPoints}
        />
        <Text style={styles.hint}>{t('createEvent.rewardPointsHint')}</Text>

        <Button
          title={t('createEvent.continueToPlaces')}
          onPress={handleNext}
          loading={createEvent.isPending}
          fullWidth
          style={styles.submitButton}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  scroll: {
    flex: 1,
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
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundGray,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  difficultyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  difficultyTextActive: {
    color: colors.background,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
