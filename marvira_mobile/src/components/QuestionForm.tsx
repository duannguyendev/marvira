import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  Asset,
} from 'react-native-image-picker';
import { CreateQuestionInput, QuestionType } from '../types';
import { Input } from './Input';
import { needsImageUpload, resolveUploadUrl } from '../api/uploads';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

const QUESTION_TYPES: QuestionType[] = [
  'TEXT',
  'TRUE_FALSE',
  'MULTIPLE_CHOICE',
  'IMAGE',
];

interface QuestionFormProps {
  value: CreateQuestionInput;
  onChange: (value: CreateQuestionInput) => void;
  errors?: Partial<Record<keyof CreateQuestionInput | 'options', string>>;
}

function previewUri(imageUrl?: string): string | undefined {
  if (!imageUrl) {
    return undefined;
  }
  if (needsImageUpload(imageUrl)) {
    return imageUrl;
  }
  return resolveUploadUrl(imageUrl);
}

export const QuestionForm: React.FC<QuestionFormProps> = ({
  value,
  onChange,
  errors,
}) => {
  const { t } = useTranslation();
  const [picking, setPicking] = useState(false);

  const setField = <K extends keyof CreateQuestionInput>(
    key: K,
    fieldValue: CreateQuestionInput[K],
  ) => {
    onChange({ ...value, [key]: fieldValue });
  };

  const handleTypeChange = (type: QuestionType) => {
    if (type === 'TRUE_FALSE') {
      onChange({
        ...value,
        type,
        answer: 'True',
        options: undefined,
        imageUrl: undefined,
      });
      return;
    }
    if (type === 'MULTIPLE_CHOICE') {
      onChange({
        ...value,
        type,
        options: value.options?.length ? value.options : ['', ''],
        answer: '',
        imageUrl: undefined,
      });
      return;
    }
    if (type === 'IMAGE') {
      onChange({
        ...value,
        type,
        options: undefined,
        answer: value.answer || '',
      });
      return;
    }
    onChange({
      ...value,
      type,
      options: undefined,
      answer: '',
      imageUrl: undefined,
    });
  };

  const updateOption = (index: number, text: string) => {
    const options = [...(value.options ?? ['', ''])];
    options[index] = text;
    onChange({ ...value, options });
  };

  const addOption = () => {
    onChange({ ...value, options: [...(value.options ?? []), ''] });
  };

  const removeOption = (index: number) => {
    const options = (value.options ?? []).filter((_, i) => i !== index);
    onChange({ ...value, options });
  };

  const applyAsset = (asset?: Asset) => {
    if (!asset?.uri) {
      return;
    }
    setField('imageUrl', asset.uri);
  };

  const handlePickerResult = (response: ImagePickerResponse) => {
    setPicking(false);
    if (response.didCancel) {
      return;
    }
    if (response.errorCode) {
      Alert.alert(
        t('common.error'),
        response.errorMessage || t('createEvent.imagePickFailed'),
      );
      return;
    }
    applyAsset(response.assets?.[0]);
  };

  const pickFromLibrary = () => {
    setPicking(true);
    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
        maxWidth: 1600,
        maxHeight: 1600,
      },
      handlePickerResult,
    );
  };

  const takePhoto = () => {
    setPicking(true);
    launchCamera(
      {
        mediaType: 'photo',
        cameraType: 'back',
        quality: 0.8,
        maxWidth: 1600,
        maxHeight: 1600,
        saveToPhotos: false,
      },
      handlePickerResult,
    );
  };

  const imagePreview = useMemo(
    () => previewUri(value.imageUrl),
    [value.imageUrl],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        {t('createEvent.questionSection')}
      </Text>

      <Text style={styles.label}>{t('createEvent.questionType')}</Text>
      <View style={styles.typeRow}>
        {QUESTION_TYPES.map(type => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeButton,
              value.type === type && styles.typeButtonActive,
            ]}
            onPress={() => handleTypeChange(type)}>
            <Text
              style={[
                styles.typeButtonText,
                value.type === type && styles.typeButtonTextActive,
              ]}>
              {t(`createEvent.questionTypes.${type}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input
        label={
          value.type === 'IMAGE'
            ? t('createEvent.imageCaption')
            : t('createEvent.questionText')
        }
        value={value.question}
        onChangeText={text => setField('question', text)}
        placeholder={
          value.type === 'IMAGE'
            ? t('createEvent.imageCaptionPlaceholder')
            : t('createEvent.questionTextPlaceholder')
        }
        multiline
        error={errors?.question}
      />

      {value.type === 'IMAGE' ? (
        <View style={styles.imageSection}>
          <Text style={styles.label}>{t('createEvent.questionImage')}</Text>
          {imagePreview ? (
            <Image
              source={{ uri: imagePreview }}
              style={styles.preview}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Text style={styles.previewPlaceholderText}>
                {t('createEvent.noImageSelected')}
              </Text>
            </View>
          )}
          <View style={styles.imageActions}>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={takePhoto}
              disabled={picking}>
              <Text style={styles.imageButtonText}>
                {t('createEvent.takePhoto')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={pickFromLibrary}
              disabled={picking}>
              <Text style={styles.imageButtonText}>
                {t('createEvent.chooseFromLibrary')}
              </Text>
            </TouchableOpacity>
          </View>
          {value.imageUrl ? (
            <TouchableOpacity
              onPress={() => setField('imageUrl', undefined)}
              style={styles.removeImage}>
              <Text style={styles.removeImageText}>
                {t('createEvent.removeImage')}
              </Text>
            </TouchableOpacity>
          ) : null}
          {picking ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: spacing.sm }}
            />
          ) : null}
          {errors?.imageUrl ? (
            <Text style={styles.errorText}>{errors.imageUrl}</Text>
          ) : null}
          <Text style={styles.hint}>{t('createEvent.imageUploadHint')}</Text>
        </View>
      ) : null}

      {value.type === 'MULTIPLE_CHOICE' ? (
        <View>
          <Text style={styles.label}>{t('createEvent.options')}</Text>
          {(value.options ?? []).map((option, index) => (
            <View key={index} style={styles.optionRow}>
              <TextInput
                style={styles.optionInput}
                value={option}
                onChangeText={text => updateOption(index, text)}
                placeholder={t('createEvent.optionPlaceholder', {
                  n: index + 1,
                })}
                placeholderTextColor={colors.textLight}
              />
              {(value.options?.length ?? 0) > 2 ? (
                <TouchableOpacity onPress={() => removeOption(index)}>
                  <Text style={styles.removeOption}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
          <TouchableOpacity onPress={addOption} style={styles.addOption}>
            <Text style={styles.addOptionText}>
              {t('createEvent.addOption')}
            </Text>
          </TouchableOpacity>
          {errors?.options ? (
            <Text style={styles.errorText}>{errors.options}</Text>
          ) : null}
        </View>
      ) : null}

      {value.type === 'TRUE_FALSE' ? (
        <View>
          <Text style={styles.label}>{t('createEvent.correctAnswer')}</Text>
          <View style={styles.typeRow}>
            {(['True', 'False'] as const).map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.typeButton,
                  value.answer === option && styles.typeButtonActive,
                ]}
                onPress={() => setField('answer', option)}>
                <Text
                  style={[
                    styles.typeButtonText,
                    value.answer === option && styles.typeButtonTextActive,
                  ]}>
                  {t(option === 'True' ? 'common.true' : 'common.false')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <Input
          label={t('createEvent.correctAnswer')}
          value={value.answer}
          onChangeText={text => setField('answer', text)}
          placeholder={t('createEvent.answerPlaceholder')}
          error={errors?.answer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundGray,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  typeButtonTextActive: {
    color: colors.background,
  },
  imageSection: {
    marginBottom: spacing.md,
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundGray,
    marginBottom: spacing.sm,
  },
  previewPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: Platform.OS === 'ios' ? 'dashed' : 'solid',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    backgroundColor: colors.backgroundGray,
  },
  previewPlaceholderText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  imageActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  imageButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundGray,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  imageButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  removeImage: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  removeImageText: {
    color: colors.error,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  hint: {
    marginTop: spacing.sm,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  optionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textDark,
    backgroundColor: colors.background,
  },
  removeOption: {
    fontSize: fontSize.lg,
    color: colors.error,
    padding: spacing.xs,
  },
  addOption: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  addOptionText: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.error,
    marginBottom: spacing.sm,
  },
});
