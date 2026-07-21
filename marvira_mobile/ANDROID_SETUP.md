# Android Setup Guide

## Option 1: Create Android Emulator (Recommended)

### Step 1: Install Android Studio
1. Download and install [Android Studio](https://developer.android.com/studio)
2. During installation, make sure to install:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (AVD)

### Step 2: Set Environment Variables
Add these to your system environment variables:

**Windows:**
1. Open System Properties → Environment Variables
2. Add new System Variable:
   - Variable: `ANDROID_HOME`
   - Value: `C:\Users\YourUsername\AppData\Local\Android\Sdk` (or your SDK path)
3. Add to Path:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\emulator`
   - `%ANDROID_HOME%\tools`
   - `%ANDROID_HOME%\tools\bin`

**PowerShell (Temporary for current session):**
```powershell
$env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:ANDROID_HOME\tools;$env:ANDROID_HOME\tools\bin"
```

### Step 3: Create an Android Virtual Device (AVD)

**Using Android Studio:**
1. Open Android Studio
2. Go to **Tools → Device Manager** (or **More Actions → Virtual Device Manager**)
3. Click **Create Device**
4. Select a device (e.g., **Pixel 5**)
5. Click **Next**
6. Select a system image (e.g., **API 33** or **API 34** - Android 13/14)
7. Click **Download** if needed, then **Next**
8. Click **Finish**

**Using Command Line:**
```bash
# List available system images
sdkmanager --list

# Install a system image (e.g., Android 13)
sdkmanager "system-images;android-33;google_apis;x86_64"

# Create AVD
avdmanager create avd -n Pixel5_API33 -k "system-images;android-33;google_apis;x86_64" -d "pixel_5"
```

### Step 4: Start the Emulator
```bash
# List available AVDs
emulator -list-avds

# Start an emulator (replace with your AVD name)
emulator -avd Pixel5_API33
```

Or start from Android Studio: Click the ▶️ play button next to your AVD.

### Step 5: Run the App
Once the emulator is running:
```bash
npm start
# In another terminal:
npm run android
```

---

## Option 2: Use Physical Android Device

### Step 1: Enable Developer Options
1. Go to **Settings → About Phone**
2. Tap **Build Number** 7 times
3. Go back to **Settings → Developer Options**

### Step 2: Enable USB Debugging
1. In **Developer Options**, enable **USB Debugging**
2. Connect your device via USB

### Step 3: Verify Device Connection
```bash
adb devices
```
You should see your device listed.

### Step 4: Run the App
```bash
npm start
# In another terminal:
npm run android
```

---

## Troubleshooting

### Emulator not found
- Make sure Android Studio is installed
- Verify `ANDROID_HOME` is set correctly
- Restart your terminal after setting environment variables

### ADB not found
- Add `%ANDROID_HOME%\platform-tools` to your PATH
- Restart terminal

### Build errors
- Make sure you have accepted Android SDK licenses:
  ```bash
  %ANDROID_HOME%\tools\bin\sdkmanager --licenses
  ```

### Emulator is slow
- Enable hardware acceleration in BIOS (Intel VT-x or AMD-V)
- Allocate more RAM to the emulator in AVD settings
- Use x86_64 system images instead of ARM

