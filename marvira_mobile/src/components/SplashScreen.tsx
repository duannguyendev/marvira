import React from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../theme';

/** Cold-start / auth-boot splash — same gradient as LoginScreen. */
export const SplashScreen: React.FC = () => (
  <View style={styles.container}>
    <StatusBar
      barStyle="light-content"
      backgroundColor="transparent"
      translucent
    />
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      style={styles.gradient}>
      <ActivityIndicator size="large" color={colors.background} />
    </LinearGradient>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
