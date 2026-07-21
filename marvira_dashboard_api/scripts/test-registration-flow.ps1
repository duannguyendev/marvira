# Mobile registration + password reset flow tests
$ErrorActionPreference = "Stop"
$base = "http://localhost:3001"
$passed = 0
$failed = 0
$results = @()

function Test-Step($name, $scriptBlock) {
  try {
    & $scriptBlock
    $script:passed++
    $script:results += [pscustomobject]@{ Status = "PASS"; Test = $name; Detail = "" }
    Write-Host "[PASS] $name" -ForegroundColor Green
  } catch {
    $script:failed++
    $msg = $_.Exception.Message
    $script:results += [pscustomobject]@{ Status = "FAIL"; Test = $name; Detail = $msg }
    Write-Host "[FAIL] $name - $msg" -ForegroundColor Red
  }
}

function Expect-HttpStatus($method, $uri, $body, $expectedStatus) {
  try {
    if ($body) {
      Invoke-RestMethod -Uri $uri -Method $method -ContentType "application/json" -Body $body | Out-Null
    } else {
      Invoke-RestMethod -Uri $uri -Method $method | Out-Null
    }
    throw "Expected HTTP $expectedStatus but request succeeded"
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -ne $expectedStatus) {
      throw "Expected HTTP $expectedStatus, got $status - $($_.Exception.Message)"
    }
  }
}

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$newEmail = "mobile.register.$ts@example.com"
$newPassword = "SecurePass123"
$googleEmail = "mobile.google.$ts@gmail.com"
$facebookEmail = "mobile.facebook.$ts@facebook.com"
$appleEmail = "mobile.apple.$ts@icloud.com"

Write-Host "`n=== Mobile Registration + Password Reset Tests ===`n" -ForegroundColor Cyan

Write-Host "--- Flow 1: Register form ---`n" -ForegroundColor Yellow

Test-Step "Register: create new account" {
  $body = (@{ email = $newEmail; name = "New Mobile User"; password = $newPassword } | ConvertTo-Json)
  $r = Invoke-RestMethod -Uri "$base/auth/register" -Method POST -ContentType "application/json" -Body $body
  if (-not $r.success) { throw "Register failed" }
  if ($r.data.user.provider -ne "LOCAL") { throw "Expected LOCAL provider" }
  if ($r.data.user.PSObject.Properties.Name -contains "passwordHash") { throw "passwordHash leaked" }
  $script:registerToken = $r.data.tokens.accessToken
}

Test-Step "Register: duplicate email rejected (409)" {
  $body = (@{ email = $newEmail; name = "Duplicate"; password = $newPassword } | ConvertTo-Json)
  Expect-HttpStatus POST "$base/auth/register" $body 409
}

Test-Step "Register: login with new password" {
  $body = (@{ email = $newEmail; password = $newPassword } | ConvertTo-Json)
  $r = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" -Body $body
  if ($r.data.user.email -ne $newEmail) { throw "Wrong user" }
}

Test-Step "Register: wrong password rejected (401)" {
  $body = (@{ email = $newEmail; password = "WrongPass123" } | ConvertTo-Json)
  Expect-HttpStatus POST "$base/auth/login" $body 401
}

Write-Host "`n--- Flow 2: Forgot / reset password ---`n" -ForegroundColor Yellow

Test-Step "Forgot password: request reset email" {
  $body = (@{ email = $newEmail } | ConvertTo-Json)
  $r = Invoke-RestMethod -Uri "$base/auth/forgot-password" -Method POST -ContentType "application/json" -Body $body
  if (-not $r.success) { throw "Forgot password failed" }
  if (-not $r.data.devResetToken) { throw "Expected devResetToken in development" }
  $script:resetToken = $r.data.devResetToken
}

Test-Step "Reset password: set new password with token" {
  $newPass = "ResetPass456"
  $body = (@{ token = $resetToken; password = $newPass } | ConvertTo-Json)
  $r = Invoke-RestMethod -Uri "$base/auth/reset-password" -Method POST -ContentType "application/json" -Body $body
  if (-not $r.success) { throw "Reset failed" }
  $script:resetPassword = $newPass
}

Test-Step "Reset password: login with new password" {
  $body = (@{ email = $newEmail; password = $resetPassword } | ConvertTo-Json)
  $r = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" -Body $body
  if ($r.data.user.email -ne $newEmail) { throw "Login after reset failed" }
}

Test-Step "Reset password: used token rejected (400)" {
  $body = (@{ token = "already-used-token"; password = "AnotherPass1" } | ConvertTo-Json)
  Expect-HttpStatus POST "$base/auth/reset-password" $body 400
}

Write-Host "`n--- Flow 3: SSO registration ---`n" -ForegroundColor Yellow

Test-Step "SSO: Google creates new user" {
  $body = (@{
    email = $googleEmail
    name = "Google Mobile User"
    avatar = "https://lh3.googleusercontent.com/a/test"
  } | ConvertTo-Json)
  $r = Invoke-RestMethod -Uri "$base/auth/google" -Method POST -ContentType "application/json" -Body $body
  if ($r.data.user.provider -ne "GOOGLE") { throw "Expected GOOGLE provider" }
  $script:googleUserId = $r.data.user.id
}

Test-Step "SSO: Google returning user same id" {
  $body = (@{ email = $googleEmail; name = "Google Mobile User" } | ConvertTo-Json)
  $r = Invoke-RestMethod -Uri "$base/auth/google" -Method POST -ContentType "application/json" -Body $body
  if ($r.data.user.id -ne $googleUserId) { throw "User id changed" }
}

Test-Step "SSO: Facebook creates new user" {
  $body = (@{
    email = $facebookEmail
    name = "Facebook Mobile User"
    avatar = "https://graph.facebook.com/test/picture"
  } | ConvertTo-Json)
  $r = Invoke-RestMethod -Uri "$base/auth/facebook" -Method POST -ContentType "application/json" -Body $body
  if ($r.data.user.provider -ne "FACEBOOK") { throw "Expected FACEBOOK provider" }
}

Test-Step "SSO: Apple creates new user" {
  $body = (@{ email = $appleEmail; name = "Apple Mobile User" } | ConvertTo-Json)
  $r = Invoke-RestMethod -Uri "$base/auth/apple" -Method POST -ContentType "application/json" -Body $body
  if ($r.data.user.provider -ne "APPLE") { throw "Expected APPLE provider" }
}

Test-Step "SSO: forgot password ignored for Google user (no error)" {
  $body = (@{ email = $googleEmail } | ConvertTo-Json)
  $r = Invoke-RestMethod -Uri "$base/auth/forgot-password" -Method POST -ContentType "application/json" -Body $body
  if (-not $r.success) { throw "Should return success generically" }
}

Write-Host "`n=== Results: $passed passed, $failed failed ===`n" -ForegroundColor Cyan
$results | Format-Table -AutoSize -Wrap
if ($failed -gt 0) { exit 1 }
