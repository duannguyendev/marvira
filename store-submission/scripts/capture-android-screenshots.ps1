# Capture Marvira Android screenshots (release build, production API).
param(
  [string]$Serial = "emulator-5554",
  [string]$OutDir = "$PSScriptRoot\..\images\screenshots\android"
)

$ErrorActionPreference = "Stop"
$adb = if ($env:ANDROID_HOME) { "$env:ANDROID_HOME\platform-tools\adb.exe" } else { "adb" }

function Adb([string[]]$Cmd) { & $adb "-s" $Serial @Cmd }
function AdbShell([string]$Cmd) { & $adb "-s" $Serial "shell" $Cmd }
function Wait([int]$Sec) { Start-Sleep -Seconds $Sec }

function Tap([int]$X, [int]$Y) {
  AdbShell "input tap $X $Y" | Out-Null
  Wait 1
}

function Capture([string]$Name) {
  $path = Join-Path $OutDir $Name
  $proc = Start-Process -FilePath $adb -ArgumentList @("-s", $Serial, "exec-out", "screencap", "-p") -NoNewWindow -PassThru -RedirectStandardOutput $path -Wait
  if ($proc.ExitCode -ne 0) { throw "screencap failed for $Name" }
  Write-Host "Saved $Name"
}

function DumpUi {
  AdbShell "uiautomator dump /sdcard/window_dump.xml" | Out-Null
  Adb @("pull", "/sdcard/window_dump.xml", "$env:TEMP\marvira_ui.xml") | Out-Null
  return Get-Content "$env:TEMP\marvira_ui.xml" -Raw -Encoding UTF8
}

function TapText([string]$Text) {
  $xml = DumpUi
  $esc = [regex]::Escape($Text)
  foreach ($pat in @(
    "text=`"$esc`"[^>]*bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]`"",
    "content-desc=`"$esc`"[^>]*bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]`""
  )) {
    if ($xml -match $pat) {
      Tap ([int](([int]$Matches[1] + [int]$Matches[3]) / 2)) ([int](([int]$Matches[2] + [int]$Matches[4]) / 2))
      return $true
    }
  }
  return $false
}

function TypeText([string]$Text) {
  $safe = $Text -replace ' ', '%s' -replace '@', '\@' -replace '!', '\!'
  AdbShell "input text $safe" | Out-Null
}

function ClearField {
  AdbShell "input keyevent 123" | Out-Null  # MOVE_END
  for ($i = 0; $i -lt 40; $i++) { AdbShell "input keyevent 67" | Out-Null }  # DEL
}

function TabBar([int]$Index, [int]$W, [int]$H) {
  $x = [int]($W * (0.125 + 0.25 * ($Index - 1)))
  $y = [int]($H - 50)
  Tap $x $y
}

function SetupDevice {
  AdbShell "pm grant com.marvira android.permission.ACCESS_FINE_LOCATION" | Out-Null
  AdbShell "pm grant com.marvira android.permission.ACCESS_COARSE_LOCATION" | Out-Null
  Adb @("emu", "geo", "fix", "105.852019", "21.028511") | Out-Null
}

function LoginFresh {
  AdbShell "pm clear com.marvira" | Out-Null
  Wait 2
  SetupDevice
  AdbShell "monkey -p com.marvira -c android.intent.category.LAUNCHER 1" | Out-Null
  Wait 10
  if (TapText "While using the app") { Wait 2 }

  # Login form (1080x2400 layout)
  Tap 540 920
  ClearField
  TypeText "demo@marvira.com"
  Wait 1
  Tap 540 1040
  ClearField
  TypeText "DemoTest123!"
  Wait 1
  AdbShell "input keyevent 111" | Out-Null
  Wait 1
  Tap 540 1180
  Wait 12
  if (TapText "While using the app") { Wait 2 }
}

function EnableAllLanguages([int]$W) {
  TabBar 4 $W 2400
  Wait 3
  TapText "Settings" | Out-Null
  Wait 3
  Tap ([int]($W * 0.9)) 680
  Wait 2
  AdbShell "input keyevent 4" | Out-Null
  Wait 2
  AdbShell "input keyevent 4" | Out-Null
  Wait 2
  TabBar 1 $W 2400
  Wait 4
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$sizeLine = (AdbShell "wm size" | Out-String).Trim()
$w = 1080; $h = 2400
if ($sizeLine -match '(\d+)x(\d+)') { $w = [int]$Matches[1]; $h = [int]$Matches[2] }
Write-Host "Device $Serial ${w}x${h}"

LoginFresh
EnableAllLanguages $w

# Radius All (first pill)
Tap 120 360
Wait 4

Capture "01-events-list.png"

Tap ([int]($w * 0.5)) ([int]($h * 0.55))
Wait 5
Capture "02-event-details.png"

if (TapText "View leaderboard") {
  Wait 4
  Capture "05-leaderboard.png"
  AdbShell "input keyevent 4" | Out-Null
  Wait 2
}

TabBar 1 $w $h
Wait 2
Tap ([int]($w * 0.92)) 120
Wait 4
Capture "05b-global-leaderboard.png"
AdbShell "input keyevent 4" | Out-Null
Wait 2

Tap ([int]($w * 0.5)) ([int]($h * 0.55))
Wait 4
foreach ($label in @("Join hunt", "Start hunt", "Start", "Join")) {
  if (TapText $label) { break }
}
Wait 6
Capture "03-place-game.png"

TabBar 2 $w $h
Wait 4
Capture "07-practice.png"

TabBar 4 $w $h
Wait 3
TapText "My Events" | Out-Null
Wait 3
Capture "08-my-events.png"

TabBar 1 $w $h
Wait 2
Tap ([int]($w * 0.88)) ([int]($h * 0.82))
Wait 4
Capture "06-create-event.png"

Write-Host "Done -> $OutDir"
