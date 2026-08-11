import React from 'react';
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

/**
 * Official brand assets + sizes (phone + iPad):
 * - Google: g-logo.png (200px) — sharp at 20pt through 3x / iPad 2x
 * - Apple: Left-aligned White Medium @1x/@2x/@3x (31×44 pt) from
 *   Logo-Sign-in-with-Apple.dmg — correct for text buttons; height matches
 *   Apple’s 44pt control so PNGs are used 1:1 (HIG: PNG only at 44pt)
 * - Facebook: Primary logo 2084px — sharp at 22pt on all densities
 *
 * All buttons share height 44pt (equal prominence + Apple PNG contract).
 */

export type SocialProvider = 'google' | 'apple' | 'facebook';

type Props = {
  provider: SocialProvider;
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

/** Apple HIG recommended Sign in with Apple control height. */
const BUTTON_HEIGHT = 44;

const ICON = {
  google: { width: 20, height: 20, circleCrop: false, gap: 10 },
  // Left-aligned Medium already includes title spacing in the asset.
  apple: { width: 31, height: 44, circleCrop: false, gap: 0 },
  facebook: { width: 22, height: 22, circleCrop: true, gap: 10 },
} as const;

const ICONS: Record<SocialProvider, ImageSourcePropType> = {
  google: require('../../assets/social/google-logo.png'),
  apple: require('../../assets/social/apple-logo-left-white.png'),
  facebook: require('../../assets/social/facebook-logo-primary.png'),
};

const THEMES = {
  google: {
    backgroundColor: '#FFFFFF',
    borderColor: '#747775',
    borderWidth: 1,
    textColor: '#1F1F1F',
    spinner: '#1F1F1F',
  },
  apple: {
    backgroundColor: '#000000',
    borderColor: '#000000',
    borderWidth: 0,
    textColor: '#FFFFFF',
    spinner: '#FFFFFF',
  },
  facebook: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
    borderWidth: 0,
    textColor: '#FFFFFF',
    spinner: '#FFFFFF',
  },
} as const;

export const SocialSignInButton: React.FC<Props> = ({
  provider,
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
}) => {
  const theme = THEMES[provider];
  const icon = ICON[provider];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.backgroundColor,
          borderColor: theme.borderColor,
          borderWidth: theme.borderWidth,
          opacity: isDisabled ? 0.55 : pressed ? 0.9 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={theme.spinner} />
      ) : (
        <View style={[styles.content, { gap: icon.gap }]}>
          <View
            style={[
              styles.iconWrap,
              { width: icon.width, height: icon.height },
              icon.circleCrop && styles.iconCircleCrop,
            ]}>
            <Image
              source={ICONS[provider]}
              style={{ width: icon.width, height: icon.height }}
              resizeMode="contain"
              accessibilityElementsHidden
            />
          </View>
          <Text
            style={[styles.label, { color: theme.textColor }]}
            numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: BUTTON_HEIGHT,
    minHeight: BUTTON_HEIGHT,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleCrop: {
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: '#1877F2',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.15,
    flexShrink: 1,
  },
});
