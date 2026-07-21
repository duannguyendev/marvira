# Android development setup (Windows)

Marvira mobile requires a configured Android SDK to build and run on emulator or device.

## Quick check

From `marvira_mobile`:

```powershell
npm run doctor:android
```

Or run the setup script directly:

```powershell
.\scripts\setup-android.ps1
```

## Requirements

| Component | Version |
|-----------|---------|
| JDK | 17 or 20 (not 21+) |
| Android SDK Platform | android-34 |
| Android SDK Build-Tools | 34.0.0 |
| Android Studio | Latest stable |

## Step-by-step

### 1. Install JDK 17 or 20

Download [Eclipse Temurin 17](https://adoptium.net/) or 20 and install.

Set `JAVA_HOME` (User environment variable):

```powershell
[Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot', 'User')
```

Restart the terminal and verify:

```powershell
java -version
```

### 2. Install Android Studio

1. Download from [developer.android.com/studio](https://developer.android.com/studio)
2. During setup, install **Android SDK**, **SDK Platform**, and **Android Virtual Device**
3. Open **SDK Manager** (Settings â†’ Languages & Frameworks â†’ Android SDK):
   - **SDK Platforms**: Android 14 (API 34)
   - **SDK Tools**: Android SDK Build-Tools 34, Platform-Tools, Emulator

### 3. Set ANDROID_HOME

Default SDK path on Windows:

```
%LOCALAPPDATA%\Android\Sdk
```

Set permanently:

```powershell
[Environment]::SetEnvironmentVariable('ANDROID_HOME', "$env:LOCALAPPDATA\Android\Sdk", 'User')
[Environment]::SetEnvironmentVariable('Path', "$env:LOCALAPPDATA\Android\Sdk\platform-tools;$env:LOCALAPPDATA\Android\Sdk\emulator;$env:Path", 'User')
```

Restart the terminal.

### 4. Create and start an emulator

1. Android Studio â†’ **Device Manager** â†’ **Create Virtual Device**
2. Pick a phone profile (e.g. Pixel 7)
3. Select **API 34** system image
4. Start the emulator before running the app

Verify:

```powershell
adb devices
```

You should see `emulator-5554   device`.

### 5. Run the app

Ensure the API is running (`marvira_dashboard_api`), then:

```powershell
cd marvira_mobile
npm install
npm run android
```

Point the app at your API via the dev settings screen or `.env` if configured.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `SDK location not found` | Set `ANDROID_HOME` and restart terminal |
| `Unsupported class file major version` | Switch to JDK 17 or 20 |
| `No devices connected` | Start an AVD or enable USB debugging on a physical device |
| `adb` not recognized | Add `%ANDROID_HOME%\platform-tools` to `Path` |
