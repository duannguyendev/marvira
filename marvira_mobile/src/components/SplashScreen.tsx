import React from 'react';
import { Image, Platform, StatusBar, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, splashGradient } from '../theme';

const splashIcon = require('../assets/splash-icon.png');

/**
 * Android 12 SplashScreen.IconBackground: 240dp circle, artwork in inner 160dp.
 * Match that so a timeout fallback does not crop the mark.
 */
const ANDROID_ICON_BG = 240;
const ANDROID_ICON = 160;
const IOS_ICON = 120;

/**
 * Cold-start splash underlay.
 * Android: native SplashScreen stays up until Login/Events is ready; this view
 * only shows if the system splash exits early (timeout).
 * iOS: gradient + icon (LaunchScreen → first paint).
 */
export const SplashScreen: React.FC = () => {
  const icon = (
    <Image
      source={splashIcon}
      style={Platform.OS === 'android' ? styles.androidIcon : styles.iosIcon}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      {Platform.OS === 'android' ? (
        <View style={styles.center}>
          <View style={styles.androidIconBg}>{icon}</View>
        </View>
      ) : (
        <LinearGradient colors={[...splashGradient]} style={styles.center}>
          {icon}
        </LinearGradient>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosIcon: {
    width: IOS_ICON,
    height: IOS_ICON,
  },
  androidIconBg: {
    width: ANDROID_ICON_BG,
    height: ANDROID_ICON_BG,
    borderRadius: ANDROID_ICON_BG / 2,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  androidIcon: {
    width: ANDROID_ICON,
    height: ANDROID_ICON,
  },
});
