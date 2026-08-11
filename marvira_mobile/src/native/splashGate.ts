import { NativeModules, Platform } from 'react-native';

/**
 * Dismiss Android system splash once React splash UI is on screen.
 * No-op on iOS (UILaunchStoryboard covers until first paint).
 */
export function hideNativeSplash(): void {
  if (Platform.OS !== 'android') {
    return;
  }
  try {
    NativeModules.SplashGate?.hide?.();
  } catch {
    // Optional during early boot / missing native module in tests
  }
}
