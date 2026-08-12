import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  Asset,
} from 'react-native-image-picker';
import { appAlert } from '../utils/appAlert';
import { SafeRemoteImage } from './CoverImage';
import { needsImageUpload, resolveUploadUrl } from '../api/uploads';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

interface EventCoverImageFieldProps {
  value?: string | null;
  onChange: (uri: string | undefined) => void;
  error?: string;
}

function previewUri(imageUrl?: string | null): string | undefined {
  if (!imageUrl) {
    return undefined;
  }
  if (needsImageUpload(imageUrl)) {
    return imageUrl;
  }
  return resolveUploadUrl(imageUrl);
}

export const EventCoverImageField: React.FC<EventCoverImageFieldProps> = ({
  value,
  onChange,
  error,
}) => {
  const { t } = useTranslation();
  const [picking, setPicking] = useState(false);

  const applyAsset = (asset?: Asset) => {
    if (!asset?.uri) {
      return;
    }
    onChange(asset.uri);
  };

  const handlePickerResult = (response: ImagePickerResponse) => {
    setPicking(false);
    if (response.didCancel) {
      return;
    }
    if (response.errorCode) {
      appAlert.alert(
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
        quality: 0.85,
        maxWidth: 2048,
        maxHeight: 2048,
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
        quality: 0.85,
        maxWidth: 2048,
        maxHeight: 2048,
        saveToPhotos: false,
      },
      handlePickerResult,
    );
  };

  const imagePreview = useMemo(() => previewUri(value), [value]);

  return (
    <View style={styles.imageSection}>
      <Text style={styles.label}>{t('createEvent.coverImage')}</Text>
      {imagePreview ? (
        <SafeRemoteImage
          uri={imagePreview}
          style={styles.preview}
          placeholderStyle={styles.previewPlaceholder}
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
      {value ? (
        <TouchableOpacity
          onPress={() => onChange(undefined)}
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
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Text style={styles.hint}>{t('createEvent.coverImageHint')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  imageSection: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  previewPlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  previewPlaceholderText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
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
    fontWeight: fontWeight.medium,
    color: colors.textDark,
  },
  removeImage: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  removeImageText: {
    fontSize: fontSize.sm,
    color: colors.error,
    fontWeight: fontWeight.medium,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
