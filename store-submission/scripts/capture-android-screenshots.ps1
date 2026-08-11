# Capture Marvira Android screenshots (production release on emulator).
param(
  [string]$Serial = "emulator-5554",
  [string]$OutDir = "$PSScriptRoot\..\images\screenshots\android"
)

$ErrorActionPreference = "Stop"
$adb = "$env:ANDROID_HOME\platform-tools\adb.exe"

function AdbShell([string]$Cmd) { & $adb "-s" $Serial "shell" $Cmd }
function Wait([int]$Sec) { Start-Sleep -Seconds $Sec }

function Capture([string]$Name) {
  $path = Join-Path $OutDir $Name
  $p = Start-Process -FilePath $adb -ArgumentList @("-s", $Serial, "exec-out", "screencap", "-p") -NoNewWindow -PassThru -RedirectStandardOutput $path -Wait
  if ($p.ExitCode -ne 0 -or (Get-Item $path).Length -lt 1000) { throw "Bad capture: $Name" }
  Write-Host "Saved $Name ($((Get-Item $path).Length) bytes)"
}

function Get-Ui { AdbShell "uiautomator dump /sdcard/w.xml" | Out-Null; & $adb "-s" $Serial pull /sdcard/w.xml "$env:TEMP\w.xml" | Out-Null; Get-Content "$env:TEMP\w.xml" -Raw }

function Tap([int]$X, [int]$Y) { AdbShell "input tap $X $Y" | Out-Null; Wait 1 }

function TapText([string]$Text) {
  $xml = Get-Ui
  $esc = [regex]::Escape($Text)
  if ($xml -match "text=`"$esc`"[^>]*bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]`"") {
    Tap ([int](([int]$Matches[1]+$Matches[3])/2)) ([int](([int]$Matches[2]+$Matches[4])/2)); return $true
  }
  if ($xml -match "content-desc=`"$esc`"[^>]*bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]`"") {
    Tap ([int](([int]$Matches[1]+$Matches[3])/2)) ([int](([int]$Matches[2]+$Matches[4])/2)); return $true
  }
  return $false
}

function TapEdit([string]$Ph) {
  $xml = Get-Ui; $esc = [regex]::Escape($Ph)
  if ($xml -match "EditText[^>]*text=`"$esc`"[^>]*bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]`"") {
    Tap ([int](([int]$Matches[1]+$Matches[3])/2)) ([int](([int]$Matches[2]+$Matches[4])/2)); return $true
  }
  return $false
}

function TypeText([string]$T) { AdbShell ("input text " + ($T -replace ' ','%s' -replace '@','\@' -replace '!','\!')) | Out-Null }
function ClearField { AdbShell "input keyevent 123" | Out-Null; 1..48 | ForEach-Object { AdbShell "input keyevent 67" | Out-Null } }
function Back { AdbShell "input keyevent 4" | Out-Null; Wait 1 }
function Tab([int]$I,[int]$W,[int]$H) { Tap ([int]($W*(0.125+0.25*($I-1)))) ([int]($H-55)) }

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$W=1080; $H=2400

AdbShell "pm clear com.marvira" | Out-Null; Wait 2
AdbShell "pm grant com.marvira android.permission.ACCESS_FINE_LOCATION" | Out-Null
AdbShell "pm grant com.marvira android.permission.ACCESS_COARSE_LOCATION" | Out-Null
AdbShell "pm grant com.marvira android.permission.POST_NOTIFICATIONS" 2>$null | Out-Null
& $adb "-s" $Serial emu geo fix 105.852019 21.028511 | Out-Null
AdbShell "monkey -p com.marvira -c android.intent.category.LAUNCHER 1" | Out-Null; Wait 10

TapEdit "Enter your email"; ClearField; TypeText "demo@marvira.com"; Wait 1
TapEdit "Enter your password"; ClearField; TypeText "DemoTest123!"; Wait 1
AdbShell "input keyevent 111" | Out-Null; Wait 1
TapText "Sign In"; Wait 12
TapText "Allow"; Wait 2
TapText "While using the app"; Wait 2

Tab 4 $W $H; Wait 3; TapText "Settings"; Wait 3
Tap 950 700; Wait 2; Back; Back; Tab 1 $W $H; Wait 3
TapText "All"; Wait 5

Capture "01-events-list.png"

$xml = Get-Ui
if ($xml -match 'text="M[^"]*thu[^"]*"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"') {
  Tap ([int](($Matches[1]+$Matches[3])/2)) ([int](($Matches[2]+$Matches[4])/2)+100)
} else { Tap ($W/2) ([int]($H*0.58)) }
Wait 5
Capture "02-event-details.png"

if (TapText "View leaderboard") { Wait 4; Capture "05-leaderboard.png"; Back }

Tab 1 $W $H; Wait 2; Tap 990 130; Wait 4
Capture "05b-global-leaderboard.png"; Back

$xml = Get-Ui
if ($xml -match 'text="M[^"]*thu[^"]*"') { Tap ($W/2) ([int]($H*0.58)) }
Wait 4
foreach ($b in @("Join hunt","Start hunt","Start","Join")) { if (TapText $b) { break } }
Wait 6; Capture "03-place-game.png"

Tab 2 $W $H; Wait 4; Capture "07-practice.png"
Tab 4 $W $H; Wait 3; TapText "My Events"; Wait 3; Capture "08-my-events.png"
Tab 1 $W $H; Wait 2; Tap 950 ([int]($H*0.84)); Wait 4; Capture "06-create-event.png"

Write-Host "Done"
