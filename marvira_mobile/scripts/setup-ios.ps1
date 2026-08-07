# Regenerates ios/ from React Native template (only when you need a fresh native project).
# Normal builds use the committed marvira_mobile/ios folder - no _ios_template required.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$TemplateDir = Join-Path $Root ".tmp\ios_template"

if (Test-Path (Join-Path $Root "ios\Marvira.xcodeproj")) {
  Write-Host "ios/Marvira.xcodeproj already exists - nothing to generate."
  Write-Host 'On macOS: cd ios; pod install; cd ..; npm run ios'
  exit 0
}

Write-Host "Generating React Native 0.85.1 template at $TemplateDir ..."
if (Test-Path $TemplateDir) {
  Remove-Item -Recurse -Force $TemplateDir
}
New-Item -ItemType Directory -Path $TemplateDir -Force | Out-Null

npx @react-native-community/cli@20.1.0 init MarviraIOSTemplate `
  --version 0.85.1 `
  --skip-install `
  --directory $TemplateDir `
  --pm npm

$SourceIos = Join-Path $TemplateDir "ios"
$TargetIos = Join-Path $Root "ios"

if (-not (Test-Path $SourceIos)) {
  Write-Error "Template ios folder not found at $SourceIos"
}

if (Test-Path $TargetIos) {
  Write-Host "Removing existing ios folder..."
  Remove-Item -Recurse -Force $TargetIos
}

Write-Host "Copying ios project to $TargetIos ..."
Copy-Item -Recurse $SourceIos $TargetIos

# Rename template project to Marvira
Rename-Item (Join-Path $TargetIos "MarviraIOSTemplate") "Marvira"
Rename-Item (Join-Path $TargetIos "MarviraIOSTemplate.xcodeproj") "Marvira.xcodeproj"
$schemePath = Join-Path $TargetIos "Marvira.xcodeproj\xcshareddata\xcschemes\MarviraIOSTemplate.xcscheme"
if (Test-Path $schemePath) {
  Rename-Item $schemePath "Marvira.xcscheme"
}

Get-ChildItem $TargetIos -Recurse -File | ForEach-Object {
  $content = [System.IO.File]::ReadAllText($_.FullName)
  $updated = $content -replace 'MarviraIOSTemplate','Marvira' -replace 'marviraiostemplate','marvira'
  if ($updated -ne $content) {
    [System.IO.File]::WriteAllText($_.FullName, $updated)
  }
}

Write-Host "Cleaning up temporary template..."
Remove-Item -Recurse -Force $TemplateDir

Write-Host 'Done. On macOS run: cd ios; pod install'
Write-Host 'Set MAPBOX_ACCESS_TOKEN in ../.env.local (or Codemagic) and add location usage strings in Info.plist if needed'
