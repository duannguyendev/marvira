# Android Environment Setup Script for React Native
# Run this script before running npm run android

$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:ANDROID_HOME\tools;$env:ANDROID_HOME\tools\bin;$env:PATH"

Write-Host "Android environment configured!" -ForegroundColor Green
Write-Host "ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Cyan

# List available emulators
Write-Host "`nAvailable emulators:" -ForegroundColor Yellow
& "$env:ANDROID_HOME\emulator\emulator" -list-avds

Write-Host "`nTo start an emulator, run:" -ForegroundColor Yellow
Write-Host "  emulator -avd Pixel_8_API_34" -ForegroundColor White
Write-Host "`nOr use Android Studio to start an emulator." -ForegroundColor Yellow

