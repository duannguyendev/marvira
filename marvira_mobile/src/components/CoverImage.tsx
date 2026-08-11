import React, { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../theme';

interface CoverImageProps {
  uri?: string | null;
  style?: StyleProp<ImageStyle | ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * Card cover: shows brand gradient when URI is missing or the image fails to load.
 */
export const CoverImage: React.FC<CoverImageProps> = ({
  uri,
  style,
  accessibilityLabel,
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const showImage = Boolean(uri?.trim()) && !failed;

  if (!showImage) {
    return (
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={[styles.base, style]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  return (
    <Image
      source={{ uri: uri!.trim() }}
      style={[styles.base, style as StyleProp<ImageStyle>]}
      accessibilityLabel={accessibilityLabel}
      onError={() => setFailed(true)}
    />
  );
};

interface SafeRemoteImageProps {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  placeholderStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center' | 'repeat';
}

/**
 * Remote image with a solid muted box if missing/failed (question previews, etc.).
 */
export const SafeRemoteImage: React.FC<SafeRemoteImageProps> = ({
  uri,
  style,
  placeholderStyle,
  accessibilityLabel,
  resizeMode = 'cover',
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const showImage = Boolean(uri?.trim()) && !failed;

  if (!showImage) {
    return (
      <View
        style={[styles.placeholder, style, placeholderStyle]}
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  return (
    <Image
      source={{ uri: uri!.trim() }}
      style={style}
      resizeMode={resizeMode}
      accessibilityLabel={accessibilityLabel}
      onError={() => setFailed(true)}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.backgroundGray,
  },
  placeholder: {
    backgroundColor: colors.backgroundGray,
  },
});
