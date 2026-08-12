import { NativeModules, Platform } from 'react-native';

/**
 * Dismiss Android system splash once Login / Events has painted.
 * Kept until then so users never see a handoff to the React splash underlay.
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
