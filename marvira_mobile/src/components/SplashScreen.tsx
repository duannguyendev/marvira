import React, { useCallback, useRef } from 'react';
import { Image, Platform, StatusBar, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { hideNativeSplash } from '../native/splashGate';
import { colors, splashGradient } from '../theme';

const splashIcon = require('../assets/splash-icon.png');

/** Android 12+ splash icon is a 240dp circle; match that so JS does not jump. */
const ANDROID_ICON = 240;
const IOS_ICON = 120;

/** Cold-start splash — iOS: gradient + icon; Android: solid + circular icon. */
export const SplashScreen: React.FC = () => {
  const dismissed = useRef(false);

  const onReady = useCallback(() => {
    if (dismissed.current) {
      return;
    }
    dismissed.current = true;
    hideNativeSplash();
  }, []);

  const icon = (
    <Image
      source={splashIcon}
      style={Platform.OS === 'android' ? styles.androidIcon : styles.iosIcon}
      resizeMode="cover"
      accessibilityIgnoresInvertColors
      onLoadEnd={onReady}
    />
  );

  return (
    <View style={styles.container} onLayout={onReady}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      {Platform.OS === 'android' ? (
        <View style={styles.center}>
          <View style={styles.androidIconClip}>{icon}</View>
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
  androidIconClip: {
    width: ANDROID_ICON,
    height: ANDROID_ICON,
    borderRadius: ANDROID_ICON / 2,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  androidIcon: {
    width: ANDROID_ICON,
    height: ANDROID_ICON,
  },
});
