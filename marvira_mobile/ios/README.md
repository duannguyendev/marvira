# iOS Project Setup

The mobile app targets React Native 0.85.1 with New Architecture enabled.

## Quick setup (Mac required for `pod install` + build)

The `ios/` folder is committed in this repo. You normally do **not** need to regenerate it.

```bash
cd marvira_mobile
npm install
cd ios && pod install && cd ..
npm run ios
```

To regenerate `ios/` from the React Native template (rare):

```powershell
cd marvira_mobile
Remove-Item -Recurse -Force ios   # only if you intend to replace the project
.\scripts\setup-ios.ps1
cd ios && pod install
```

## Required Info.plist keys

- `NSLocationWhenInUseUsageDescription` — location for gameplay unlock
- `GMSApiKey` — set automatically at build time from Codemagic ENV or `../.env.local`
  (Xcode phase `Apply Google Maps API Key`)

## Bundle identifier

`com.marvira` (match Android `applicationId`)

## Notes

- iOS deployment target: 16.0
- New Architecture is enabled (`newArchEnabled=true` / `RCT_NEW_ARCH_ENABLED=1`)
- Build and TestFlight upload require Apple Developer account
- Physical device recommended for GPS gameplay testing
