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
| `MAPBOX_ACCESS_TOKEN` | Required (JS → Mapbox SDK) | Required |
| `API_BASE_URL` | Not used (`__DEV__` → localhost) | **Required:** `https://api.marvira.com` |
| `MARKETING_SITE_URL` | Not used (`__DEV__` → localhost:3002) | **Required:** `https://www.marvira.com` |
| `GOOGLE_WEB_CLIENT_ID` | Optional until social login | Required for Google Sign-In |
| `FACEBOOK_APP_ID` | Optional until social login | Required for Facebook Login |
| `FACEBOOK_CLIENT_TOKEN` | Optional until social login | Required for Facebook Login |

Do **not** use Railway `*.up.railway.app` URLs in release builds once custom domains are live.

Apple Sign-In: enable capability on App ID `com.marvira`; set API `APPLE_CLIENT_ID`. Replace iOS Info.plist placeholders `GOOGLE_REVERSED_CLIENT_ID` / `fbFACEBOOK_APP_ID` / Facebook keys when credentials arrive (see `release_credentials.txt`).

Also replace Android `strings.xml` Facebook placeholders before testing Facebook Login.

## How each platform reads them

- **Maps (Android + iOS):** Babel inlines `MAPBOX_ACCESS_TOKEN` from Codemagic ENV or `.env.local`; `Mapbox.setAccessToken` runs at app start.
- **Android Gradle:** Mapbox Maven repo is configured in `android/build.gradle` (no download token required).
- **JS release URLs:** Babel loads `.env.local` if ENV is empty, then inlines `API_BASE_URL` / `MARKETING_SITE_URL` into the bundle.

## Local setup

```bash
cd marvira_mobile
cp .env.example .env.local
# set MAPBOX_ACCESS_TOKEN=pk....
# release/local-prod smoke: API_BASE_URL + MARKETING_SITE_URL already point at marvira.com in .env.example

yarn android
# or
yarn ios
```

## Codemagic setup

1. Use root `codemagic.yaml` (committed at repo root).
2. Env group **`marvira_mobile_secrets`** — set (or update) at least:

   | Name | Value |
   |------|--------|
   | `API_BASE_URL` | `https://api.marvira.com` |
   | `MARKETING_SITE_URL` | `https://www.marvira.com` |
   | `MAPBOX_ACCESS_TOKEN` | (your token) |
   | `GOOGLE_WEB_CLIENT_ID` | (Web OAuth client) |
   | `FACEBOOK_APP_ID` / `FACEBOOK_CLIENT_TOKEN` | (Meta) |
   | `GOOGLE_PLAY_SERVICE_ACCOUNT_CREDENTIALS` | full Play Console API JSON key |

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
