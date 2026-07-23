import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { PlaceQuestion } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { API_BASE_URL } from '../utils/constants';

interface QuestionRendererProps {
  question: PlaceQuestion;
  answer: string;
  onChangeAnswer: (value: string) => void;
}

function resolveImageUrl(imageUrl?: string): string | undefined {
  if (!imageUrl) {
    return undefined;
  }
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  return `${API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  answer,
  onChangeAnswer,
}) => {
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const imageUri = resolveImageUrl(question.imageUrl);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    onChangeAnswer(option);
  };

  const trueFalseOptions = [
    { value: 'True', label: t('common.true') },
    { value: 'False', label: t('common.false') },
  ];

  return (
    <View>
      {question.type === 'IMAGE' && imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.questionImage} />
      ) : null}

      <Text style={styles.question}>{question.text}</Text>

      {question.type === 'MULTIPLE_CHOICE' && question.options ? (
        <View style={styles.optionsContainer}>
          {question.options.map(option => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                selectedOption === option && styles.optionButtonSelected,
              ]}
              onPress={() => handleOptionSelect(option)}>
              <Text
                style={[
                  styles.optionText,
                  selectedOption === option && styles.optionTextSelected,
                ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {question.type === 'TRUE_FALSE' ? (
        <View style={styles.optionsContainer}>
          {trueFalseOptions.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                selectedOption === option.value && styles.optionButtonSelected,
              ]}
              onPress={() => handleOptionSelect(option.value)}>
              <Text
                style={[
                  styles.optionText,
                  selectedOption === option.value && styles.optionTextSelected,
                ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {question.type === 'TEXT' || question.type === 'IMAGE' ? (
        <TextInput
          style={styles.answerInput}
          placeholder={t('game.enterYourAnswer')}
          placeholderTextColor={colors.textLight}
          value={answer}
          onChangeText={onChangeAnswer}
          multiline
          autoCapitalize="none"
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  questionImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.backgroundGray,
  },
  question: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textDark,
    marginBottom: spacing.lg,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  optionButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  optionButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoLight,
  },
  optionText: {
    fontSize: fontSize.md,
    color: colors.textDark,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  answerInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.textDark,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
});
