import React, { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import FastImage, {
  type FastImageProps,
  type ResizeMode,
} from '@d11/react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../theme';
import { encodeRemoteImageUri, isRemoteHttpUri } from '../utils/imageCache';

interface CoverImageProps {
  uri?: string | null;
  style?: StyleProp<ImageStyle | ViewStyle>;
  accessibilityLabel?: string;
}

function mapResizeMode(
  mode: 'cover' | 'contain' | 'stretch' | 'center' | 'repeat',
): ResizeMode {
  switch (mode) {
    case 'contain':
      return FastImage.resizeMode.contain;
    case 'stretch':
      return FastImage.resizeMode.stretch;
    case 'center':
      return FastImage.resizeMode.center;
    case 'cover':
    default:
      return FastImage.resizeMode.cover;
  }
}

type LoadMode = 'fast' | 'native' | 'failed';

/**
 * Card cover: brand gradient when URI is missing or every loader fails.
 * Prefers FastImage; falls back to RN Image (helps when Glide/SDWebImage choke).
 */
export const CoverImage: React.FC<CoverImageProps> = ({
  uri,
  style,
  accessibilityLabel,
}) => {
  const [mode, setMode] = useState<LoadMode>('fast');

  useEffect(() => {
    setMode('fast');
  }, [uri]);

  const trimmed = uri?.trim() ?? '';
  const loadUri = trimmed ? encodeRemoteImageUri(trimmed) : '';
  const imageStyle = [styles.base, style] as StyleProp<ImageStyle>;

  if (!trimmed || mode === 'failed') {
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

  if (isRemoteHttpUri(trimmed) && mode === 'fast') {
    return (
      <FastImage
        source={{
          uri: loadUri,
          priority: FastImage.priority.normal,
          cache: FastImage.cacheControl.immutable,
        }}
        style={imageStyle as FastImageProps['style']}
        resizeMode={FastImage.resizeMode.cover}
        accessibilityLabel={accessibilityLabel}
        onError={() => setMode('native')}
      />
    );
  }

  return (
    <Image
      source={{ uri: loadUri }}
      style={imageStyle}
      resizeMode="cover"
      accessibilityLabel={accessibilityLabel}
      onError={() => setMode('failed')}
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
  const [mode, setMode] = useState<LoadMode>('fast');

  useEffect(() => {
    setMode('fast');
  }, [uri]);

  const trimmed = uri?.trim() ?? '';
  const loadUri = trimmed ? encodeRemoteImageUri(trimmed) : '';

  if (!trimmed || mode === 'failed') {
    return (
      <View
        style={[styles.placeholder, style, placeholderStyle]}
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  if (isRemoteHttpUri(trimmed) && mode === 'fast') {
    return (
      <FastImage
        source={{
          uri: loadUri,
          priority: FastImage.priority.normal,
          cache: FastImage.cacheControl.immutable,
        }}
        style={style as FastImageProps['style']}
        resizeMode={mapResizeMode(resizeMode)}
        accessibilityLabel={accessibilityLabel}
        onError={() => setMode('native')}
      />
    );
  }

  return (
    <Image
      source={{ uri: loadUri }}
      style={style}
      resizeMode={resizeMode === 'repeat' ? 'cover' : resizeMode}
      accessibilityLabel={accessibilityLabel}
      onError={() => setMode('failed')}
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
