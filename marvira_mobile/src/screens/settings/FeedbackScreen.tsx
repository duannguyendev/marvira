import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { feedbackApi } from '../../api/feedback';
import { FeedbackCategory } from '../../types';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '../../theme';

const CATEGORIES: FeedbackCategory[] = [
  FeedbackCategory.FEEDBACK,
  FeedbackCategory.SUGGESTION,
  FeedbackCategory.BUG,
  FeedbackCategory.OTHER,
];

export const FeedbackScreen: React.FC = () => {
  const { t } = useTranslation();
  const [category, setCategory] = useState<FeedbackCategory>(
    FeedbackCategory.FEEDBACK,
  );
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (message.trim().length < 10) {
      Alert.alert(t('common.error'), t('feedback.validationMessageMin'));
      return;
    }

    setSubmitting(true);
    try {
      await feedbackApi.submit({
        category,
        subject: subject.trim() || undefined,
        message: message.trim(),
      });
      Alert.alert(t('feedback.successTitle'), t('feedback.successMessage'));
      setCategory(FeedbackCategory.FEEDBACK);
      setSubject('');
      setMessage('');
    } catch (error: any) {
      Alert.alert(
        t('common.error'),
        error.message || t('feedback.submitFailed'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('feedback.title')}</Text>
        <Text style={styles.sectionDescription}>
          {t('feedback.description')}
        </Text>

        <Text style={styles.label}>{t('feedback.category')}</Text>
        <View style={styles.categoryList}>
          {CATEGORIES.map(item => {
            const selected = category === item;
            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.categoryOption,
                  selected && styles.categoryOptionSelected,
                ]}
                onPress={() => setCategory(item)}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.categoryLabel,
                    selected && styles.categoryLabelSelected,
                  ]}>
                  {t(`feedback.categories.${item.toLowerCase()}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>{t('feedback.subject')}</Text>
        <TextInput
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
          placeholder={t('feedback.subjectPlaceholder')}
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>{t('feedback.message')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={message}
          onChangeText={setMessage}
          placeholder={t('feedback.messagePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <Button
          title={t('feedback.submit')}
          onPress={handleSubmit}
          loading={submitting}
          fullWidth
          style={styles.submitButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textDark,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  categoryOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoLight,
  },
  categoryLabel: {
    fontSize: fontSize.sm,
    color: colors.textDark,
  },
  categoryLabelSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.textDark,
  },
  textArea: {
    minHeight: 140,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
});
