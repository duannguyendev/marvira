package com.marvira

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Lets JS dismiss the Android 12+ SplashScreen once the React splash UI has painted,
 * avoiding a white flash between native splash and Auth/boot splash.
 */
class SplashGateModule(
    reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "SplashGate"

  @ReactMethod
  fun hide() {
    MainActivity.keepSplashOnScreen = false
  }
}
