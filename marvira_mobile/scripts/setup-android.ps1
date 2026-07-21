# Configures Android development environment for Marvira mobile (Windows).
# Run from repo root: .\scripts\setup-android.ps1
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$SdkVersion = "36.0.0"
$JdkVersions = @(17, 20, 21)

function Write-Step($Message) {
  Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Test-Command($Name) {
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

Write-Host "Marvira Android environment setup" -ForegroundColor Green
Write-Host "Project: $Root"

$issues = @()

Write-Step "Checking Java (JDK 17 or 20)"
if (Test-Command "java") {
  $javaVersion = (java -version 2>&1 | Select-Object -First 1) -replace '"', ''
  Write-Host "Found: $javaVersion"
  if ($javaVersion -match 'version "(\d+)') {
    $major = [int]$Matches[1]
    if ($major -notin $JdkVersions) {
      $issues += "JDK $major detected; React Native 0.85 supports JDK 17â€“21. Install Temurin 17, 20, or 21 and set JAVA_HOME."
    }
  }
} else {
  $issues += "java not found. Install Eclipse Temurin JDK 17 or 20."
}

Write-Step "Checking ANDROID_HOME"
$androidHome = $env:ANDROID_HOME
if (-not $androidHome) {
  $defaultSdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
  if (Test-Path $defaultSdk) {
    $androidHome = $defaultSdk
    Write-Host "ANDROID_HOME not set; default SDK found at $androidHome"
    Write-Host "Set permanently: [Environment]::SetEnvironmentVariable('ANDROID_HOME', '$androidHome', 'User')"
  } else {
    $issues += "ANDROID_HOME is not set and default SDK path not found. Install Android Studio."
  }
} else {
  Write-Host "ANDROID_HOME=$androidHome"
}

if ($androidHome) {
  Write-Step "Checking Android SDK platform-tools"
  $adb = Join-Path $androidHome "platform-tools\adb.exe"
  if (-not (Test-Path $adb)) {
    $issues += "adb not found at $adb. Install 'Android SDK Platform-Tools' in Android Studio SDK Manager."
  } else {
    Write-Host "adb: $adb"
  }

  Write-Step "Checking Android NDK (27+ required, 28+ recommended for 16 KB page size)"
  $ndkDir = Join-Path $androidHome "ndk"
  if (Test-Path $ndkDir) {
    $ndkVersions = Get-ChildItem $ndkDir | Select-Object -ExpandProperty Name
    Write-Host "Installed NDK: $($ndkVersions -join ', ')"
    if ($ndkVersions -notcontains "28.0.12433566") {
      Write-Host "Tip: Install NDK 28.0.12433566 via Android Studio > SDK Manager > SDK Tools for 16 KB page-size compliance." -ForegroundColor Yellow
    }
  }

  Write-Step "Checking Android SDK $SdkVersion"
  $buildTools = Get-ChildItem (Join-Path $androidHome "build-tools") -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -eq $SdkVersion }
  if (-not $buildTools) {
    $installed = Get-ChildItem (Join-Path $androidHome "build-tools") -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty Name
    Write-Host "Installed build-tools: $($installed -join ', ')"
    $issues += "Android SDK build-tools $SdkVersion not found. Install via Android Studio > SDK Manager."
  } else {
    Write-Host "build-tools $SdkVersion OK"
  }

  $platform = Join-Path $androidHome "platforms\android-36"
  if (-not (Test-Path $platform)) {
    $issues += "Android platform android-36 not installed."
  } else {
    Write-Host "platform android-36 OK"
  }
}

Write-Step "Checking Android Studio"
$studioPaths = @(
  "${env:ProgramFiles}\Android\Android Studio\bin\studio64.exe",
  "${env:ProgramFiles(x86)}\Android\Android Studio\bin\studio64.exe",
  "${env:LOCALAPPDATA}\Programs\Android Studio\bin\studio64.exe"
)
$studio = $studioPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($studio) {
  Write-Host "Android Studio: $studio"
} else {
  $issues += "Android Studio not detected. Download from https://developer.android.com/studio"
}

Write-Step "Checking connected devices / emulators"
if (Test-Command "adb" -or ($androidHome -and (Test-Path $adb))) {
  $adbCmd = if (Test-Path $adb) { $adb } else { "adb" }
  $env:ANDROID_HOME = $androidHome
  $env:PATH = "$(Join-Path $androidHome 'platform-tools');$(Join-Path $androidHome 'emulator');$env:PATH"
  $devices = & $adbCmd devices 2>&1
  Write-Host $devices
  if ($devices -notmatch "emulator-\d+\s+device" -and $devices -notmatch "\w+\s+device" -or $devices -match "List of devices attached\s*$") {
    $issues += "No Android device/emulator connected. Create an AVD in Android Studio Device Manager and start it."
  }
}

Write-Step "React Native doctor"
Push-Location $Root
try {
  if (Test-Path "node_modules") {
    npx react-native doctor
  } else {
    Write-Host "Run npm install first, then re-run this script."
    $issues += "node_modules missing â€” run npm install in marvira_mobile."
  }
} finally {
  Pop-Location
}

Write-Host "`n--- Summary ---" -ForegroundColor Yellow
if ($issues.Count -eq 0) {
  Write-Host "Environment looks ready. Run: npm run android" -ForegroundColor Green
} else {
  Write-Host "Fix the following:" -ForegroundColor Red
  $issues | ForEach-Object { Write-Host "  - $_" }
  Write-Host "`nSee android/README.md for step-by-step instructions."
  exit 1
}
