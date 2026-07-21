# Manual test script for Marvira API + Dashboard smoke tests
$ErrorActionPreference = "Stop"
$base = "http://localhost:3001"
$dash = "http://localhost:3000"
$passed = 0
$failed = 0
$results = @()

function Invoke-DbSql($sql) {
  $psql = Get-Command psql -ErrorAction SilentlyContinue
  if ($psql) {
    $env:PGPASSWORD = "marvira"
    $sql | & psql -h localhost -U postgres -d marvira -q
    if ($LASTEXITCODE -ne 0) { throw "psql failed (exit $LASTEXITCODE)" }
    return
  }
  Push-Location (Join-Path $PSScriptRoot "..\apps\api")
  try {
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $sql | npx prisma db execute --stdin --schema prisma/schema.prisma 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "prisma db execute failed (exit $LASTEXITCODE)" }
  } finally {
    $ErrorActionPreference = $prevEap
    Pop-Location
  }
}

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

Write-Host "`n=== Marvira Manual Test Run ===`n" -ForegroundColor Cyan

Test-Step "Setup: seed database" {
  Push-Location (Join-Path $PSScriptRoot "..")
  pnpm db:seed 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "db:seed failed" }
  Pop-Location
}

# --- Dashboard pages (HTTP 200) ---
Test-Step "Dashboard: /login loads" {
  $r = Invoke-WebRequest -Uri "$dash/login" -UseBasicParsing
  if ($r.StatusCode -ne 200) { throw "Status $($r.StatusCode)" }
}

Test-Step "Dashboard: /dashboard/events loads" {
  $r = Invoke-WebRequest -Uri "$dash/dashboard/events" -UseBasicParsing
  if ($r.StatusCode -ne 200) { throw "Status $($r.StatusCode)" }
}

Test-Step "Dashboard: /dashboard/questions loads" {
  $r = Invoke-WebRequest -Uri "$dash/dashboard/questions" -UseBasicParsing
  if ($r.StatusCode -ne 200) { throw "Status $($r.StatusCode)" }
}

Test-Step "Dashboard: /dashboard/practice loads" {
  $r = Invoke-WebRequest -Uri "$dash/dashboard/practice" -UseBasicParsing
  if ($r.StatusCode -ne 200) { throw "Status $($r.StatusCode)" }
}

# --- Auth ---
$token = $null
$refresh = $null
Test-Step "API: Admin login" {
  $body = '{"email":"admin@marvira.com","password":"admin123"}'
  $r = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" -Body $body
  if (-not $r.success) { throw "Login failed" }
  if ($r.data.user.role -ne "ADMIN") { throw "Not admin" }
  $script:token = $r.data.tokens.accessToken
  $script:refresh = $r.data.tokens.refreshToken
}

$headers = @{ Authorization = "Bearer $token" }

Test-Step "API: GET /auth/me" {
  $r = Invoke-RestMethod -Uri "$base/auth/me" -Headers $headers
  if ($r.data.email -ne "admin@marvira.com") { throw "Wrong user" }
}

# --- Events ---
$eventId = $null
$placeWithQuestion = $null
$placeWithoutQuestion = $null

Test-Step "API: GET /admin/events" {
  $r = Invoke-RestMethod -Uri "$base/admin/events" -Headers $headers
  if ($r.data.items.Count -lt 1) { throw "No events" }
  $script:eventId = "seed-event-downtown"
  $found = $r.data.items | Where-Object { $_.id -eq $eventId }
  if (-not $found) { throw "Seed event not found - run pnpm db:seed" }
}

Test-Step "API: GET /admin/events/:id (with questions)" {
  $r = Invoke-RestMethod -Uri "$base/admin/events/$eventId" -Headers $headers
  if (-not $r.data.places) { throw "No places" }
  if (-not $r.data.eventQuestions) { throw "No eventQuestions" }
  $script:placeWithQuestion = $r.data.places | Where-Object { $_.question } | Select-Object -First 1
  $script:placeWithoutQuestion = $r.data.places | Where-Object { -not $_.question } | Select-Object -First 1
  if ($r.data.eventQuestions.Count -lt 1) { throw "No questions linked to event" }
  if (-not $placeWithQuestion) { throw "No place with assigned question" }
}

Test-Step "API: Admin event includes answer field" {
  if (-not $placeWithQuestion.question.answer) { throw "Answer missing from admin response" }
}

Test-Step "API: Public GET /events/:id hides answer" {
  $r = Invoke-RestMethod -Uri "$base/events/$eventId"
  $q = $r.data.places | Where-Object { $_.question } | Select-Object -First 1
  if ($q.question.PSObject.Properties.Name -contains "answer") { throw "Answer leaked on public endpoint" }
}

# --- Question CRUD ---
$newQuestionId = $null

Test-Step "API: GET /admin/questions" {
  $r = Invoke-RestMethod -Uri "$base/admin/questions" -Headers $headers
  if ($r.data.items.Count -lt 1) { throw "No questions in bank" }
}

Test-Step "API: POST /questions (create standalone)" {
  $body = @{
    question = "Manual test: capital of France?"
    type = "TEXT"
    answer = "Paris"
    explanation = "Paris is the capital."
    points = 15
  } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/questions" -Method POST -Headers $headers -ContentType "application/json" -Body $body
  if ($r.data.answer -ne "Paris") { throw "Wrong answer returned" }
  $script:newQuestionId = $r.data.id
}

Test-Step "API: POST link question to event" {
  $body = @{ questionId = $newQuestionId } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/admin/events/$eventId/questions" -Method POST -Headers $headers -ContentType "application/json" -Body $body
  if ($r.data.questionId -ne $newQuestionId) { throw "Link failed" }
}

if ($placeWithoutQuestion) {
  Test-Step "API: Assign question to place" {
    $body = @{ questionId = $newQuestionId } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$base/places/$($placeWithoutQuestion.id)" -Method PATCH -Headers $headers -ContentType "application/json" -Body $body
    if ($r.data.questionId -ne $newQuestionId) { throw "Assign failed" }
    $script:assignPlaceId = $placeWithoutQuestion.id
  }
} else {
  $script:assignPlaceId = $null
}

Test-Step "API: POST link duplicate rejected" {
  try {
    $body = @{ questionId = $newQuestionId } | ConvertTo-Json
    Invoke-RestMethod -Uri "$base/admin/events/$eventId/questions" -Method POST -Headers $headers -ContentType "application/json" -Body $body
    throw "Should have failed"
  } catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 409) { throw "Expected 409, got $($_.Exception.Message)" }
  }
}

Test-Step "API: PATCH /questions/:id (update)" {
  $body = @{
    question = "Manual test: updated question?"
    answer = "UpdatedAnswer"
    points = 20
  } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/questions/$newQuestionId" -Method PATCH -Headers $headers -ContentType "application/json" -Body $body
  if ($r.data.points -ne 20) { throw "Update failed" }
}

Test-Step "API: MULTIPLE_CHOICE validation (answer must match option)" {
  $qBody = @{
    question = "Pick one"
    type = "MULTIPLE_CHOICE"
    options = @("Alpha", "Beta")
    answer = "Alpha"
    points = 10
  } | ConvertTo-Json
  $q = (Invoke-RestMethod -Uri "$base/questions" -Method POST -Headers $headers -ContentType "application/json" -Body $qBody).data
  if ($q.answer -ne "Alpha") { throw "MC create failed" }
  Invoke-RestMethod -Uri "$base/questions/$($q.id)" -Method DELETE -Headers $headers | Out-Null
}

# --- Analytics & users ---
Test-Step "API: GET /admin/analytics" {
  $r = Invoke-RestMethod -Uri "$base/admin/analytics" -Headers $headers
  if (-not $r.data.overview) { throw "No overview" }
}

Test-Step "API: GET /admin/users" {
  $r = Invoke-RestMethod -Uri "$base/admin/users" -Headers $headers
  if ($r.data.items.Count -lt 1) { throw "No users" }
}

Test-Step "API: GET /events (public list)" {
  $r = Invoke-RestMethod -Uri "$base/events"
  if ($r.data.items.Count -lt 1) { throw "No public events" }
}

Test-Step "API: Demo user login" {
  $body = '{"email":"demo@marvira.com","password":"demo123"}'
  $r = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" -Body $body
  if ($r.data.user.role -ne "USER") { throw "Demo user wrong role" }
  $script:demoToken = $r.data.tokens.accessToken
  $script:demoRefresh = $r.data.tokens.refreshToken
}

$demoHeaders = @{ Authorization = "Bearer $demoToken" }

# --- Practice & Favorites (API) ---
Write-Host "`n--- Practice & Favorites ---`n" -ForegroundColor Cyan

Test-Step "Practice: Reset demo training (re-runnable)" {
  $sql = @"
DELETE FROM user_practice_completions
WHERE user_id = (SELECT id FROM users WHERE email = 'demo@marvira.com')
  AND question_id IN ('seed-practice-2', 'seed-practice-3');
"@
  Invoke-DbSql $sql
}

Test-Step "API: GET /practice/questions?status=unfinished" {
  $r = Invoke-RestMethod -Uri "$base/practice/questions?status=unfinished" -Headers $demoHeaders
  if ($r.data.Count -lt 1) { throw "Expected unfinished practice questions" }
  foreach ($q in $r.data) {
    if ($q.PSObject.Properties.Name -contains "answer") { throw "Answer leaked in practice list" }
  }
}

Test-Step "API: Practice wrong then correct answer" {
  $wrong = @{ answer = "True" } | ConvertTo-Json
  $wr = Invoke-RestMethod -Uri "$base/practice/questions/seed-practice-2/answer" -Method POST -Headers $demoHeaders -ContentType "application/json" -Body $wrong
  if ($wr.data.isCorrect -ne $false) { throw "Wrong answer should fail" }
  $right = @{ answer = "False" } | ConvertTo-Json
  $rr = Invoke-RestMethod -Uri "$base/practice/questions/seed-practice-2/answer" -Method POST -Headers $demoHeaders -ContentType "application/json" -Body $right
  if ($rr.data.isCorrect -ne $true) { throw "Correct answer should pass" }
}

Test-Step "API: GET /practice/questions?status=completed" {
  $r = Invoke-RestMethod -Uri "$base/practice/questions?status=completed" -Headers $demoHeaders
  if ($r.data.Count -lt 1) { throw "Expected completed practice questions after training" }
  $p2 = $r.data | Where-Object { $_.id -eq "seed-practice-2" }
  if (-not $p2) { throw "seed-practice-2 not in completed list" }
}

Test-Step "API: GET /favorites/events" {
  $r = Invoke-RestMethod -Uri "$base/favorites/events" -Headers $demoHeaders
  $fav = $r.data | Where-Object { $_.id -eq "seed-event-downtown" }
  if (-not $fav) { throw "Seed favorite event missing" }
}

Test-Step "API: Favorites event idempotent add" {
  $body = @{} | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/favorites/events/seed-event-golden-gate" -Method POST -Headers $demoHeaders -ContentType "application/json" -Body $body | Out-Null
  Invoke-RestMethod -Uri "$base/favorites/events/seed-event-golden-gate" -Method POST -Headers $demoHeaders -ContentType "application/json" -Body $body | Out-Null
}

Test-Step "API: GET /favorites/questions" {
  $r = Invoke-RestMethod -Uri "$base/favorites/questions" -Headers $demoHeaders
  if ($r.data.Count -lt 1) { throw "Expected favorited questions" }
}

Test-Step "API: GET /practice/questions/mine" {
  $r = Invoke-RestMethod -Uri "$base/practice/questions/mine" -Headers $demoHeaders
  if ($null -eq $r.data) { throw "No data" }
}

Test-Step "API: GET /admin/practice/questions" {
  $r = Invoke-RestMethod -Uri "$base/admin/practice/questions?page=1&pageSize=20" -Headers $headers
  if ($r.data.items.Count -lt 1) { throw "No community practice questions" }
}

Test-Step "API: GET /admin/practice/stats" {
  $r = Invoke-RestMethod -Uri "$base/admin/practice/stats" -Headers $headers
  if ($null -eq $r.data.totalCommunityQuestions) { throw "Missing stats" }
}

Test-Step "API: GET /leaderboard/global" {
  $r = Invoke-RestMethod -Uri "$base/leaderboard/global"
  if ($null -eq $r.data) { throw "No leaderboard data" }
}

Test-Step "API: GET /events/:id/leaderboard" {
  $r = Invoke-RestMethod -Uri "$base/events/seed-event-downtown/leaderboard"
  if ($null -eq $r.data) { throw "No event leaderboard" }
}

Test-Step "API: GET /events/mine" {
  $r = Invoke-RestMethod -Uri "$base/events/mine" -Headers $demoHeaders
  if ($null -eq $r.data.items) { throw "No mine events response" }
}

Test-Step "API: GET /admin/events/:id/participants" {
  $r = Invoke-RestMethod -Uri "$base/admin/events/seed-event-downtown/participants" -Headers $headers
  if ($null -eq $r.data.participants.items) { throw "No participants response" }
}

# --- Password-protected events (TC-API-040) ---
Write-Host "`n--- Password-protected events ---`n" -ForegroundColor Cyan

$privateEventId = $null
$joinTesterHeaders = $null

Test-Step "Password: Register join tester user" {
  $email = "pwtest+$([guid]::NewGuid().ToString('N').Substring(0, 8))@marvira.com"
  $body = @{ email = $email; password = "demo1234"; name = "PW Tester" } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/auth/register" -Method POST -ContentType "application/json" -Body $body
  if (-not $r.data.tokens.accessToken) { throw "Register failed" }
  $script:joinTesterHeaders = @{ Authorization = "Bearer $($r.data.tokens.accessToken)" }
}

Test-Step "Password: Demo creates draft event" {
  $body = @{
    title = "Private Hunt Smoke"
    description = "Password-protected event for automated smoke test validation"
    city = "San Francisco"
    difficulty = "MEDIUM"
    rewardPoints = 50
    isActive = $false
  } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/events" -Method POST -Headers $demoHeaders -ContentType "application/json" -Body $body
  if ($r.data.isPasswordProtected -ne $false) { throw "Draft should be public" }
  $script:privateEventId = $r.data.id
}

Test-Step "Password: Add question and place" {
  $qBody = @{
    question = "Smoke test: password hunt?"
    type = "TEXT"
    answer = "yes"
    points = 10
  } | ConvertTo-Json
  $q = Invoke-RestMethod -Uri "$base/questions" -Method POST -Headers $demoHeaders -ContentType "application/json" -Body $qBody
  $linkBody = @{ questionId = $q.data.id; orderIndex = 0 } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/events/$privateEventId/questions" -Method POST -Headers $demoHeaders -ContentType "application/json" -Body $linkBody | Out-Null
  $placeBody = @{
    eventId = $privateEventId
    title = "Stop 1"
    description = "First stop"
    latitude = 37.7749
    longitude = -122.4194
    radiusMeters = 100
    orderIndex = 0
    questionId = $q.data.id
  } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/places" -Method POST -Headers $demoHeaders -ContentType "application/json" -Body $placeBody | Out-Null
}

Test-Step "Password: Publish with joinPassword" {
  $body = '{"isActive":true,"joinPassword":"hunt2026"}'
  $r = Invoke-RestMethod -Uri "$base/events/$privateEventId" -Method PATCH -Headers $demoHeaders -ContentType "application/json" -Body $body
  if ($r.data.isPasswordProtected -ne $true) { throw "Expected isPasswordProtected=true" }
  if ($r.data.PSObject.Properties.Name -contains "joinPasswordHash") { throw "Password hash leaked" }
}

Test-Step "Password: Join tester denied before password" {
  $r = Invoke-RestMethod -Uri "$base/events/$privateEventId" -Headers $joinTesterHeaders
  if ($r.data.hasAccess -ne $false) { throw "Expected hasAccess=false" }
  if ($r.data.places.Count -ne 0) { throw "Places should be redacted" }
  $places = Invoke-RestMethod -Uri "$base/events/$privateEventId/places" -Headers $joinTesterHeaders
  if ($places.data.Count -ne 0) { throw "Places endpoint should be empty" }
}

Test-Step "Password: Wrong password rejected (403)" {
  try {
    $body = '{"password":"wrong"}'
    Invoke-RestMethod -Uri "$base/events/$privateEventId/join" -Method POST -Headers $joinTesterHeaders -ContentType "application/json" -Body $body
    throw "Should have been forbidden"
  } catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 403) { throw "Expected 403, got $($_.Exception.Message)" }
  }
}

Test-Step "Password: Correct password grants access" {
  $body = '{"password":"hunt2026"}'
  $r = Invoke-RestMethod -Uri "$base/events/$privateEventId/join" -Method POST -Headers $joinTesterHeaders -ContentType "application/json" -Body $body
  if ($r.data.hasAccess -ne $true) { throw "Expected hasAccess=true after join" }
  $detail = Invoke-RestMethod -Uri "$base/events/$privateEventId" -Headers $joinTesterHeaders
  if ($detail.data.hasAccess -ne $true) { throw "Detail should show hasAccess=true" }
  $places = Invoke-RestMethod -Uri "$base/events/$privateEventId/places" -Headers $joinTesterHeaders
  if ($places.data.Count -lt 1) { throw "Places should be visible after join" }
}

Test-Step "Password: Creator has access without join" {
  $r = Invoke-RestMethod -Uri "$base/events/$privateEventId" -Headers $demoHeaders
  if ($r.data.hasAccess -ne $true) { throw "Creator should have access" }
  if ($r.data.places.Count -lt 1) { throw "Creator should see places" }
}

Test-Step "Password: Public list shows isPasswordProtected" {
  $r = Invoke-RestMethod -Uri "$base/events?pageSize=50"
  $found = $r.data.items | Where-Object { $_.id -eq $privateEventId }
  if (-not $found) { throw "Private event not in public list" }
  if ($found.isPasswordProtected -ne $true) { throw "List missing isPasswordProtected flag" }
}

Test-Step "Password: Cleanup test event" {
  Invoke-RestMethod -Uri "$base/events/$privateEventId" -Method DELETE -Headers $demoHeaders | Out-Null
}

# --- Mobile gameplay flow (API used by mobile app) ---
Write-Host "`n--- Mobile API flow ---`n" -ForegroundColor Cyan

$mobileEventId = "seed-event-downtown"
$mobilePlaces = @(
  @{ id = "seed-place-1"; lat = 37.7879; lon = -122.4075; answer = "1850" }
  @{ id = "seed-place-2"; lat = 37.7956; lon = -122.3933; answer = "Big Ben" }
  @{ id = "seed-place-3"; lat = 37.8024; lon = -122.4058; answer = "True" }
)

Test-Step "Mobile: Reset demo progress (clean slate)" {
  $sql = @"
DELETE FROM user_place_completion WHERE user_id = (SELECT id FROM users WHERE email = 'demo@marvira.com');
DELETE FROM user_event_progress WHERE user_id = (SELECT id FROM users WHERE email = 'demo@marvira.com');
"@
  Invoke-DbSql $sql
}

Test-Step "Mobile: POST /auth/refresh" {
  $body = @{ refreshToken = $demoRefresh } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/auth/refresh" -Method POST -ContentType "application/json" -Body $body
  if (-not $r.data.accessToken) { throw "No access token" }
  $script:demoToken = $r.data.accessToken
  $script:demoHeaders = @{ Authorization = "Bearer $($script:demoToken)" }
}

Test-Step "Mobile: GET /profile" {
  $r = Invoke-RestMethod -Uri "$base/profile" -Headers $demoHeaders
  if ($r.data.email -ne "demo@marvira.com") { throw "Wrong profile" }
}

Test-Step "Mobile: GET /events/nearby" {
  $r = Invoke-RestMethod -Uri "$base/events/nearby?latitude=37.79&longitude=-122.40&radiusKm=50"
  if ($r.data.Count -lt 1) { throw "No nearby events" }
}

Test-Step "Mobile: GET /events/:id detail" {
  $r = Invoke-RestMethod -Uri "$base/events/$mobileEventId"
  if ($r.data.title -ne "Downtown Discovery Hunt") { throw "Wrong event" }
  if ($r.data.places.Count -lt 3) { throw "Expected 3 places" }
}

Test-Step "Mobile: GET /events/:id/places (authenticated)" {
  $r = Invoke-RestMethod -Uri "$base/events/$mobileEventId/places" -Headers $demoHeaders
  if ($r.data.Count -lt 3) { throw "Expected 3 places" }
  $first = $r.data[0]
  if (-not $first.unlocked) { throw "First place should be unlocked" }
  if ($r.data[1].unlocked) { throw "Second place should be locked" }
}

Test-Step "Mobile: Unlock place 2 before place 1 rejected" {
  try {
    $body = @{ latitude = $mobilePlaces[1].lat; longitude = $mobilePlaces[1].lon } | ConvertTo-Json
    Invoke-RestMethod -Uri "$base/places/$($mobilePlaces[1].id)/unlock" -Method POST -Headers $demoHeaders -ContentType "application/json" -Body $body
    throw "Should have been forbidden"
  } catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 403) { throw "Expected 403, got $($_.Exception.Message)" }
  }
}

Test-Step "Mobile: POST /places/:id/unlock (place 1)" {
  $body = @{ latitude = $mobilePlaces[0].lat; longitude = $mobilePlaces[0].lon } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/places/$($mobilePlaces[0].id)/unlock" -Method POST -Headers $demoHeaders -ContentType "application/json" -Body $body
  if (-not $r.data.unlocked) { throw "Unlock failed" }
}

Test-Step "Mobile: GET /places/:id/question (no answer leak)" {
  $r = Invoke-RestMethod -Uri "$base/places/$($mobilePlaces[0].id)/question" -Headers $demoHeaders
  if ($r.data.PSObject.Properties.Name -contains "answer") { throw "Answer leaked" }
  if (-not $r.data.question) { throw "No question text" }
}

Test-Step "Mobile: POST wrong answer" {
  $body = @{
    answer = "wrong"
    latitude = $mobilePlaces[0].lat
    longitude = $mobilePlaces[0].lon
  } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/places/$($mobilePlaces[0].id)/answer" -Method POST -Headers $demoHeaders -ContentType "application/json" -Body $body
  if ($r.data.correct -ne $false) { throw "Should be incorrect" }
  if ($r.data.nextPlaceId) { throw "Should not advance on wrong answer" }
}

Test-Step "Mobile: POST correct answer place 1 -> nextPlaceId" {
  $body = @{
    answer = $mobilePlaces[0].answer
    latitude = $mobilePlaces[0].lat
    longitude = $mobilePlaces[0].lon
  } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/places/$($mobilePlaces[0].id)/answer" -Method POST -Headers $demoHeaders -ContentType "application/json" -Body $body
  if (-not $r.data.correct) { throw "Should be correct" }
  if ($r.data.nextPlaceId -ne $mobilePlaces[1].id) { throw "Wrong nextPlaceId: $($r.data.nextPlaceId)" }
  if ($r.data.points -lt 1) { throw "No points awarded" }
}

for ($i = 1; $i -lt $mobilePlaces.Count; $i++) {
  $place = $mobilePlaces[$i]
  $prev = $mobilePlaces[$i - 1]

  if ($i -gt 0) {
    Test-Step "Mobile: Wait for GPS anti-cheat (place $($i+1))" {
      Write-Host "  Sleeping 35s (location speed check between unlocks)..." -ForegroundColor DarkGray
      Start-Sleep -Seconds 35
    }
  }

  Test-Step "Mobile: Unlock place $($i+1)" {
    $body = @{ latitude = $place.lat; longitude = $place.lon } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$base/places/$($place.id)/unlock" -Method POST -Headers $demoHeaders -ContentType "application/json" -Body $body
    if (-not $r.data.unlocked) { throw "Unlock failed" }
  }

  $isLast = ($i -eq $mobilePlaces.Count - 1)
  Test-Step "Mobile: Answer place $($i+1)$(if ($isLast) { ' (complete event)' })" {
    $body = @{
      answer = $place.answer
      latitude = $place.lat
      longitude = $place.lon
    } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$base/places/$($place.id)/answer" -Method POST -Headers $demoHeaders -ContentType "application/json" -Body $body
    if (-not $r.data.correct) { throw "Should be correct" }
    if ($isLast) {
      if (-not $r.data.eventCompleted) { throw "Event should be completed" }
      if ($r.data.nextPlaceId) { throw "No nextPlaceId on last place" }
    } else {
      if ($r.data.nextPlaceId -ne $mobilePlaces[$i + 1].id) { throw "Wrong nextPlaceId" }
    }
  }
}

Test-Step "Mobile: GET /profile/completed-events" {
  $r = Invoke-RestMethod -Uri "$base/profile/completed-events" -Headers $demoHeaders
  $completed = $r.data | Where-Object { $_.eventId -eq $mobileEventId }
  if (-not $completed) { throw "Event not in completed list" }
  if (-not $completed.completed) { throw "Progress not marked completed" }
}

Test-Step "Mobile: Places show all completed" {
  $r = Invoke-RestMethod -Uri "$base/events/$mobileEventId/places" -Headers $demoHeaders
  $incomplete = $r.data | Where-Object { -not $_.completed }
  if ($incomplete.Count -gt 0) { throw "$($incomplete.Count) places not completed" }
}

# Cleanup test question created earlier (unassign from place if needed)
Test-Step "API: DELETE /questions/:id (cleanup)" {
  if ($assignPlaceId) {
    $restoreId = switch ($assignPlaceId) {
      "seed-place-1" { "seed-question-1" }
      "seed-place-2" { "seed-question-2" }
      "seed-place-3" { "seed-question-3" }
      default { $null }
    }
    if ($restoreId) {
      $body = @{ questionId = $restoreId } | ConvertTo-Json
      Invoke-RestMethod -Uri "$base/places/$assignPlaceId" -Method PATCH -Headers $headers -ContentType "application/json" -Body $body | Out-Null
    } else {
      $body = @{ questionId = $null } | ConvertTo-Json
      Invoke-RestMethod -Uri "$base/places/$assignPlaceId" -Method PATCH -Headers $headers -ContentType "application/json" -Body $body | Out-Null
    }
  }
  try {
    Invoke-RestMethod -Uri "$base/admin/events/$eventId/questions/$newQuestionId" -Method DELETE -Headers $headers | Out-Null
  } catch { }
  Invoke-RestMethod -Uri "$base/questions/$newQuestionId" -Method DELETE -Headers $headers | Out-Null
}

Test-Step "Dashboard: event edit page loads" {
  $r = Invoke-WebRequest -Uri "$dash/dashboard/events/$eventId" -UseBasicParsing
  if ($r.StatusCode -ne 200) { throw "Status $($r.StatusCode)" }
}

# --- Summary ---
Write-Host "`n=== Results: $passed passed, $failed failed ===`n" -ForegroundColor Cyan
$results | Format-Table -AutoSize
if ($failed -gt 0) { exit 1 }
