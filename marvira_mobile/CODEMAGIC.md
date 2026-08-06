# Secrets: Codemagic ENV ↔ local `.env.local`

No manual `secrets:apply` step. Builds pick up values automatically.

| Where you build | What to set | How it is read |
|-----------------|-------------|----------------|
| **Codemagic** | Secure ENV group `marvira_mobile_secrets` | Click **Start Build** |
| **Local** | `marvira_mobile/.env.local` (from `.env.example`) | `yarn android` / `yarn ios`, or Run in Android Studio / Xcode |

If required values are missing, the **build fails**.

## Required variables

| Variable | Debug (local Metro) | Release (store / Codemagic) |
|----------|---------------------|-----------------------------|
| `GOOGLE_MAPS_API_KEY` | Required (native) | Required |
| `API_BASE_URL` | Not used (`__DEV__` → localhost) | Required |
| `MARKETING_SITE_URL` | Not used (`__DEV__` → localhost:3002) | Required |
| `GOOGLE_WEB_CLIENT_ID` | Optional until social login | Required for Google Sign-In |
| `FACEBOOK_APP_ID` | Optional until social login | Required for Facebook Login |
| `FACEBOOK_CLIENT_TOKEN` | Optional until social login | Required for Facebook Login |

Apple Sign-In: enable capability on App ID `com.marvira`; set API `APPLE_CLIENT_ID`. Replace iOS Info.plist placeholders `GOOGLE_REVERSED_CLIENT_ID` / `fbFACEBOOK_APP_ID` / Facebook keys when credentials arrive (see `release_credentials.txt`).

Also replace Android `strings.xml` Facebook placeholders before testing Facebook Login.

## How each platform reads them

- **Android (Gradle):** `System.getenv` first, then `.env.local` — fails if Maps key missing.
- **iOS (Xcode build phase):** same order; injects into the built `Info.plist` via `ios/scripts/apply-maps-api-key.sh` (runs automatically on Build/Run).
- **JS release URLs:** Babel loads `.env.local` if ENV is empty, then inlines `API_BASE_URL` / `MARKETING_SITE_URL` into the bundle.

## Local setup

```bash
cd marvira_mobile
cp .env.example .env.local
# set GOOGLE_MAPS_API_KEY=...

yarn android
# or
yarn ios
```

## Codemagic setup

1. Use root `codemagic.yaml` (committed at repo root).
2. Env group **`marvira_mobile_secrets`** with all Required variables above, plus:
   - `GOOGLE_PLAY_SERVICE_ACCOUNT_CREDENTIALS` — full Play Console API JSON key
3. Code signing identities:
   - Android keystore reference: **`marvira_android`**
   - App Store Connect integration: **`marvira_asc`**
4. Start Build → `android-release` or `ios-release`.

### Auto-publish targets

| Workflow | After a green build |
|----------|---------------------|
| `android-release` | Uploads AAB to Google Play **internal** track |
| `ios-release` | Uploads IPA to **TestFlight** |

- Override Play track: set Secure/var `GOOGLE_PLAY_TRACK` to `alpha`, `beta`, or `production`.
- **First Play upload must be manual** (Play Console requirement). After that, Codemagic publishes automatically.
- Invite the Play service account under Play Console → Users and permissions (grant **Releases** on `com.marvira`).
- Build numbers auto-increment from Codemagic `BUILD_NUMBER` (Android `versionCode` + iOS `CFBundleVersion`).

### Optional Firebase via base64

```bash
base64 -i android/app/google-services.json | tr -d '\n'
base64 -i ios/Marvira/GoogleService-Info.plist | tr -d '\n'
```

Set `GOOGLE_SERVICES_JSON_BASE64` / `GOOGLE_SERVICE_INFO_PLIST_BASE64` in the env group.
