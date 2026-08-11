package com.marvira

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    // Hold the system splash until JS paints the React SplashScreen (or timeout).
    val splashScreen = installSplashScreen()
    splashScreen.setKeepOnScreenCondition { keepSplashOnScreen }
    Handler(Looper.getMainLooper()).postDelayed(
        { keepSplashOnScreen = false },
        SPLASH_MAX_MS,
    )

    supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()
    super.onCreate(null)
  }

  override fun getMainComponentName(): String = "Marvira"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  companion object {
    private const val SPLASH_MAX_MS = 8_000L

    /** Cleared from JS via SplashGate.hide() after React splash lays out. */
    @JvmField
    @Volatile
    var keepSplashOnScreen: Boolean = true
  }
}
