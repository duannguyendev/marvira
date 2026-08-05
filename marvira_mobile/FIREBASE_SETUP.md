# Firebase setup (Analytics + Crashlytics + Cloud Messaging)

See repo root `requirement_all.txt` §24 for analytics and
`push_notification_requirement.txt` for FCM + inbox.

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

**CI (Codemagic):** optional Secure env vars `GOOGLE_SERVICES_JSON_BASE64` /
`GOOGLE_SERVICE_INFO_PLIST_BASE64` (decoded in `codemagic.yaml`). See `CODEMAGIC.md`.

## 2. Enable products in Firebase Console

- Analytics
- Crashlytics
- **Cloud Messaging** (required for push)

## 3. Server credentials (API FCM send)

1. Project settings → Service accounts → Generate new private key.
2. Set on the API host (never commit the file):
   - `FIREBASE_ADMIN_CREDENTIALS_JSON` = full JSON as one line, **or**
   - `FIREBASE_ADMIN_CREDENTIALS_BASE64` = base64 of that JSON
   - optional `FIREBASE_ADMIN_PROJECT_ID`
3. Without these, the inbox API still works; tray pushes are skipped with a warning log.

## 4. iOS APNs (required for real iPhone pushes)

1. Apple Developer → Keys → create **APNs Auth Key** (`.p8`).
2. Upload in Firebase → Project settings → Cloud Messaging → Apple app.
3. Xcode: Push Notifications capability + Background Modes → Remote notifications
   (entitlements / Info.plist already wired in repo; set `aps-environment` to
   `production` for App Store builds).

## 5. Native rebuild

```bash
cd marvira_mobile
yarn install
cd ios && pod install && cd ..
# then rebuild Android / iOS
```

Android 13+: app requests `POST_NOTIFICATIONS` at runtime.
Default channel id: `marvira_default`.

## 6. DebugView (Analytics)

- Android: `adb shell setprop debug.firebase.analytics.app com.marvira`
- iOS: pass `-FIRDebugEnabled` launch argument
- Temporarily set `FORCE_ANALYTICS_IN_DEV = true` in `src/services/analytics.ts` to emit from `__DEV__` builds

## 7. Privacy

Marketing `/privacy` must mention Firebase Analytics, Crashlytics, and Cloud
Messaging / device tokens (see `requirement_all.txt` §24 and
`push_notification_requirement.txt`).
