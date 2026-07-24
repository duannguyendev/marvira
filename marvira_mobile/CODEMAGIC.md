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
| `MARKETING_SITE_URL` | Not used (`__DEV__` → localhost) | Required |

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

1. Use root `codemagic.yaml`.
2. Env group **`marvira_mobile_secrets`** with the required Secure vars.
3. Wire Android signing (`marvira_android`) and App Store Connect (`marvira_asc`).
4. Start Build — workflows verify ENV, then build.

### Optional Firebase via base64

```bash
base64 -i android/app/google-services.json | tr -d '\n'
base64 -i ios/Marvira/GoogleService-Info.plist | tr -d '\n'
```

Set `GOOGLE_SERVICES_JSON_BASE64` / `GOOGLE_SERVICE_INFO_PLIST_BASE64` in the env group.
