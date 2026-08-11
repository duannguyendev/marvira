import React, { useCallback, useRef } from 'react';
import { Image, StatusBar, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { hideNativeSplash } from '../native/splashGate';

/** Matches native Android/iOS splash (#A5B4FC → #818CF8). */
const SPLASH_GRADIENT = ['#A5B4FC', '#818CF8'] as const;

/** Cold-start / auth-boot splash — same look as native splash (icon, no spinner). */
export const SplashScreen: React.FC = () => {
  const dismissed = useRef(false);

  const onReady = useCallback(() => {
    if (dismissed.current) {
      return;
    }
    dismissed.current = true;
    hideNativeSplash();
  }, []);

  return (
    <View style={styles.container} onLayout={onReady}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient colors={[...SPLASH_GRADIENT]} style={styles.gradient}>
        <Image
          source={require('../assets/splash-icon.png')}
          style={styles.icon}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          onLoadEnd={onReady}
        />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPLASH_GRADIENT[1],
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 120,
    height: 120,
    borderRadius: 24,
  },
});
