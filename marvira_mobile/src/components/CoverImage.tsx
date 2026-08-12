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

/**
 * Card cover: shows brand gradient when URI is missing or the image fails to load.
 * Remote HTTP(S) URIs use FastImage (memory + disk cache).
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

  const trimmed = uri?.trim() ?? '';
  const showImage = Boolean(trimmed) && !failed;
  const loadUri = trimmed ? encodeRemoteImageUri(trimmed) : '';

  const frameStyle = [styles.base, style];

  if (!showImage) {
    return (
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={frameStyle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  // Size comes from the wrapper so FastImage load/error cannot resize the row.
  if (isRemoteHttpUri(trimmed)) {
    return (
      <View style={frameStyle} accessibilityLabel={accessibilityLabel}>
        <FastImage
          source={{
            uri: loadUri,
            priority: FastImage.priority.normal,
            cache: FastImage.cacheControl.web,
          }}
          style={StyleSheet.absoluteFillObject as FastImageProps['style']}
          resizeMode={FastImage.resizeMode.cover}
          onError={() => setFailed(true)}
        />
      </View>
    );
  }

  return (
    <View style={frameStyle} accessibilityLabel={accessibilityLabel}>
      <Image
        source={{ uri: loadUri }}
        style={StyleSheet.absoluteFillObject}
        onError={() => setFailed(true)}
      />
    </View>
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

  const trimmed = uri?.trim() ?? '';
  const showImage = Boolean(trimmed) && !failed;
  const loadUri = trimmed ? encodeRemoteImageUri(trimmed) : '';

  if (!showImage) {
    return (
      <View
        style={[styles.placeholder, style, placeholderStyle]}
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  if (isRemoteHttpUri(trimmed)) {
    return (
      <FastImage
        source={{
          uri: loadUri,
          priority: FastImage.priority.normal,
          cache: FastImage.cacheControl.web,
        }}
        style={style as FastImageProps['style']}
        resizeMode={mapResizeMode(resizeMode)}
        accessibilityLabel={accessibilityLabel}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Image
      source={{ uri: loadUri }}
      style={style}
      resizeMode={resizeMode === 'repeat' ? 'cover' : resizeMode}
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
