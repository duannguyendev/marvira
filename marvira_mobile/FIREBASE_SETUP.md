# Firebase setup (Analytics + Crashlytics)

See repo root `analytics_requirement.txt` for the full product spec.

## 1. Create a Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/).
2. Create a project (prefer separate **staging** and **production** projects).
3. Add Android app with package name `com.marvira`.
4. Add iOS app with bundle id `com.marvira`.
5. Download config files and **replace** the placeholders:
   - `android/app/google-services.json`
   - `ios/Marvira/GoogleService-Info.plist`
     (also keep `ios/GoogleService-Info.plist` in sync if present)

Placeholder files ship so the app can compile; they will **not** send real telemetry until replaced.

## 2. Enable products in Firebase Console

- Analytics
- Crashlytics

## 3. Native rebuild

```bash
cd marvira_mobile
yarn install
cd ios && pod install && cd ..
# then rebuild Android / iOS
```

## 4. DebugView

- Android: `adb shell setprop debug.firebase.analytics.app com.marvira`
- iOS: pass `-FIRDebugEnabled` launch argument
- Temporarily set `FORCE_ANALYTICS_IN_DEV = true` in `src/services/analytics.ts` to emit from `__DEV__` builds

## 5. Privacy

Marketing `/privacy` must mention Firebase Analytics and Crashlytics (see analytics_requirement.txt).
