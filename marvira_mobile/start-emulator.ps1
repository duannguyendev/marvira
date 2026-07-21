# Quick script to start an Android emulator
# Usage: .\start-emulator.ps1 [emulator-name]

$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\emulator"

$avdName = $args[0]

if (-not $avdName) {
    Write-Host "Available emulators:" -ForegroundColor Yellow
    & "$env:ANDROID_HOME\emulator\emulator" -list-avds
    Write-Host "`nUsage: .\start-emulator.ps1 [emulator-name]" -ForegroundColor Cyan
    Write-Host "Example: .\start-emulator.ps1 Pixel_8_API_34" -ForegroundColor Cyan
    exit
}

Write-Host "Starting emulator: $avdName" -ForegroundColor Green
& "$env:ANDROID_HOME\emulator\emulator" -avd $avdName

