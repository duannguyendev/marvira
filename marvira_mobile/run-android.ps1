# Complete Android setup and run script
# This script sets up the environment and runs the Android app

Write-Host "Setting up Android environment..." -ForegroundColor Cyan

# Set Android environment variables
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:ANDROID_HOME\tools;$env:ANDROID_HOME\tools\bin;$env:PATH"

Write-Host "ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Green

# Check if emulator exists
$emulatorPath = "$env:ANDROID_HOME\emulator\emulator.exe"
if (-not (Test-Path $emulatorPath)) {
    Write-Host "Error: Emulator not found at $emulatorPath" -ForegroundColor Red
    Write-Host "Please make sure Android SDK is installed." -ForegroundColor Yellow
    exit 1
}

# List available emulators
Write-Host "`nChecking available emulators..." -ForegroundColor Cyan
$avds = & $emulatorPath -list-avds

if ($avds.Count -eq 0) {
    Write-Host "No emulators found!" -ForegroundColor Red
    Write-Host "Please create an emulator in Android Studio:" -ForegroundColor Yellow
    Write-Host "  Tools → Device Manager → Create Device" -ForegroundColor Yellow
    exit 1
}

Write-Host "Available emulators:" -ForegroundColor Green
$avds | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }

# Check if any emulator is already running
$runningDevices = & "$env:ANDROID_HOME\platform-tools\adb.exe" devices | Where-Object { $_ -match "emulator" -or $_ -match "device$" }
$deviceCount = ($runningDevices | Measure-Object).Count - 1

if ($deviceCount -gt 0) {
    Write-Host "`nEmulator/device already running. Skipping emulator start." -ForegroundColor Green
} else {
    # Use the first available emulator or a preferred one
    $preferredAvd = $avds | Where-Object { $_ -like "*API_34*" -or $_ -like "*Pixel_8*" } | Select-Object -First 1
    if (-not $preferredAvd) {
        $preferredAvd = $avds[0]
    }
    
    Write-Host "`nStarting emulator: $preferredAvd" -ForegroundColor Cyan
    Write-Host "This may take a minute. Please wait..." -ForegroundColor Yellow
    
    # Start emulator in background
    Start-Process -FilePath $emulatorPath -ArgumentList "-avd", $preferredAvd -WindowStyle Minimized
    
    Write-Host "Waiting for emulator to boot..." -ForegroundColor Yellow
    
    # Wait for emulator to be ready (check every 5 seconds, max 2 minutes)
    $maxWait = 24  # 2 minutes
    $waited = 0
    $ready = $false
    
    while ($waited -lt $maxWait -and -not $ready) {
        Start-Sleep -Seconds 5
        $waited++
        $devices = & "$env:ANDROID_HOME\platform-tools\adb.exe" devices
        if ($devices -match "device$") {
            $ready = $true
            Write-Host "Emulator is ready!" -ForegroundColor Green
        } else {
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
    }
    
    if (-not $ready) {
        Write-Host "`nWarning: Emulator may still be booting. Continuing anyway..." -ForegroundColor Yellow
    }
}

# Now run the React Native app
Write-Host "`nRunning React Native app..." -ForegroundColor Cyan
npm run android

