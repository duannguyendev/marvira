# QA: Event completion gifts (Phase 7 API checks)
# Usage: powershell -File scripts/qa-event-completion-gifts.ps1
$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3001'
$pass = 0
$fail = 0
$findings = New-Object System.Collections.Generic.List[string]

function Ok($name) {
  $script:pass++
  Write-Host "  PASS  $name" -ForegroundColor Green
}
function Fail($name, $detail) {
  $script:fail++
  $msg = "FAIL  $name - $detail"
  Write-Host "  $msg" -ForegroundColor Red
  [void]$script:findings.Add($msg)
}
function Assert($cond, $name, $detail) {
  if ($cond) { Ok $name } else { Fail $name $detail }
}

function Login($email, $password) {
  $body = @{ email = $email; password = $password } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType 'application/json' -Body $body
  return @{
    token = $r.data.tokens.accessToken
    userId = $r.data.user.id
    headers = @{ Authorization = "Bearer $($r.data.tokens.accessToken)" }
  }
}

function ApiErrorStatus([scriptblock]$scriptBlock) {
  try {
    & $scriptBlock | Out-Null
    return $null
  } catch {
    $resp = $_.Exception.Response
    if ($resp -and $resp.StatusCode) {
      return [int]$resp.StatusCode
    }
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
      try {
        $j = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($j.statusCode) { return [int]$j.statusCode }
      } catch {}
    }
    $m = $_.Exception.Message
    if ($m -match '\b(400|401|403|404|409|422)\b') { return [int]$Matches[1] }
    throw
  }
}

function PlayThroughEvent($headers, $places) {
  $last = $null
  foreach ($p in $places) {
    $unlockBody = @{ latitude = $p.lat; longitude = $p.lon } | ConvertTo-Json
    try {
      Invoke-RestMethod -Uri "$base/places/$($p.id)/unlock" -Method POST -Headers $headers -ContentType 'application/json' -Body $unlockBody | Out-Null
    } catch {}
    $answerBody = @{
      answer = $p.answer
      latitude = $p.lat
      longitude = $p.lon
      accuracy = 10
      timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    } | ConvertTo-Json
    $last = Invoke-RestMethod -Uri "$base/places/$($p.id)/answer" -Method POST -Headers $headers -ContentType 'application/json' -Body $answerBody
  }
  return $last
}

function New-PlayablePlace($adminHeaders, $eventId) {
  $qBody = @{
    type = 'TEXT'
    question = "Gift QA question $(Get-Random)?"
    answer = '1850'
    points = 10
    explanation = '1850'
  } | ConvertTo-Json
  $q = Invoke-RestMethod -Uri "$base/questions" -Method POST -Headers $adminHeaders -ContentType 'application/json' -Body $qBody
  $questionId = $q.data.id

  $linkBody = @{ questionId = $questionId } | ConvertTo-Json
  try {
    Invoke-RestMethod -Uri "$base/admin/events/$eventId/questions" -Method POST -Headers $adminHeaders -ContentType 'application/json' -Body $linkBody | Out-Null
  } catch {
    Invoke-RestMethod -Uri "$base/events/$eventId/questions" -Method POST -Headers $adminHeaders -ContentType 'application/json' -Body $linkBody | Out-Null
  }

  $pBody = @{
    eventId = $eventId
    title = 'Gift QA Place'
    description = 'Single place for gift QA finish flow.'
    latitude = 37.7879
    longitude = -122.4075
    radiusMeters = 5000
    orderIndex = 0
    questionId = $questionId
  } | ConvertTo-Json
  $p = Invoke-RestMethod -Uri "$base/places" -Method POST -Headers $adminHeaders -ContentType 'application/json' -Body $pBody
  return $p.data.id
}

function New-GiftEvent($adminHeaders, $title, $giftTeaser, $completionMessage, $giftCodes) {
  $createBody = @{
    title = $title
    description = 'Gift QA automated test event for completion gifts.'
    city = 'San Francisco'
    difficulty = 'EASY'
    rewardPoints = 50
    isActive = $false
    giftTeaser = $giftTeaser
    completionMessage = $completionMessage
    giftCodes = $giftCodes
  }
  if ($null -eq $giftTeaser) { $createBody.Remove('giftTeaser') }
  if ($null -eq $giftCodes) { $createBody.Remove('giftCodes') }
  $json = $createBody | ConvertTo-Json
  $created = Invoke-RestMethod -Uri "$base/events" -Method POST -Headers $adminHeaders -ContentType 'application/json' -Body $json
  $eventId = $created.data.id
  $placeId = New-PlayablePlace $adminHeaders $eventId
  $pub = @{ isActive = $true } | ConvertTo-Json
  $published = Invoke-RestMethod -Uri "$base/events/$eventId" -Method PATCH -Headers $adminHeaders -ContentType 'application/json' -Body $pub
  return @{
    eventId = $eventId
    placeId = $placeId
    created = $created.data
    published = $published.data
  }
}

Write-Host ''
Write-Host '=== Event Completion Gifts QA ===' -ForegroundColor Cyan
Write-Host ''

$admin = Login 'admin@marvira.com' 'admin123'
$demo = Login 'demo@marvira.com' 'demo123'

$players = @()
for ($i = 1; $i -le 4; $i++) {
  $email = "giftqa$i-$(Get-Random)@example.com"
  $body = @{
    email = $email
    password = 'Test1234!'
    name = "GiftQA$i"
  } | ConvertTo-Json
  $reg = Invoke-RestMethod -Uri "$base/auth/register" -Method POST -ContentType 'application/json' -Body $body
  $players += @{
    email = $email
    token = $reg.data.tokens.accessToken
    userId = $reg.data.user.id
    headers = @{ Authorization = "Bearer $($reg.data.tokens.accessToken)" }
  }
}

Write-Host ''
Write-Host '--- Validation ---' -ForegroundColor Cyan

$status = ApiErrorStatus {
  $body = @{
    title = 'Gift QA No Teaser'
    description = 'Event created for gift QA validation of teaser requirement.'
    city = 'San Francisco'
    difficulty = 'EASY'
    rewardPoints = 10
    isActive = $false
    giftCodes = @('A1')
  } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/events" -Method POST -Headers $admin.headers -ContentType 'application/json' -Body $body
}
Assert ($status -eq 400) 'Teaser required when codes present' "expected 400 got $status"

$status = ApiErrorStatus {
  $codes = 1..11 | ForEach-Object { "CODE$_" }
  $body = @{
    title = 'Gift QA Too Many'
    description = 'Event created for gift QA validation of max codes.'
    city = 'San Francisco'
    difficulty = 'EASY'
    rewardPoints = 10
    isActive = $false
    giftTeaser = 'Free drink'
    giftCodes = $codes
  } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/events" -Method POST -Headers $admin.headers -ContentType 'application/json' -Body $body
}
Assert ($status -eq 400) 'Max 10 codes enforced' "expected 400 got $status"

$status = ApiErrorStatus {
  $body = @{
    title = 'Gift QA Dup Codes'
    description = 'Event created for gift QA validation of unique codes.'
    city = 'San Francisco'
    difficulty = 'EASY'
    rewardPoints = 10
    isActive = $false
    giftTeaser = 'Free drink'
    giftCodes = @('SAME', 'same')
  } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/events" -Method POST -Headers $admin.headers -ContentType 'application/json' -Body $body
}
Assert ($status -eq 400) 'Unique codes (case-insensitive) enforced' "expected 400 got $status"

Write-Host ''
Write-Host '--- Create gift event ---' -ForegroundColor Cyan
$gift = New-GiftEvent $admin.headers ("Gift QA Hunt $(Get-Random)") 'Free drink' 'Thanks! Show this code at the counter to redeem.' @('GIFT-FIRST', 'GIFT-SECOND', 'GIFT-THIRD')
$eventId = $gift.eventId
$places = @(@{ id = $gift.placeId; lat = 37.7879; lon = -122.4075; answer = '1850' })
Assert ($null -ne $eventId) 'Create event with gifts' 'no id'
Assert ($gift.created.hasGift -eq $true) 'Create response hasGift' "got $($gift.created.hasGift)"
Assert ($gift.created.giftCount -eq 3) 'Create response giftCount=3' "got $($gift.created.giftCount)"
Assert ($null -ne $gift.created.giftCodes) 'Owner create returns giftCodes' 'missing giftCodes'
Assert ($gift.created.completionMessage -like '*redeem*') 'Owner create returns completionMessage' 'missing'
Assert ($gift.published.isActive -eq $true) 'Published gift event' "isActive=$($gift.published.isActive)"
Ok "Create place ($($gift.placeId))"

Write-Host ''
Write-Host '--- Public exposure ---' -ForegroundColor Cyan
$list = Invoke-RestMethod -Uri "$base/events?pageSize=50"
$card = $list.data.items | Where-Object { $_.id -eq $eventId } | Select-Object -First 1
if (-not $card) {
  $nearbyUrl = $base + '/events/nearby?latitude=37.79&longitude=-122.40&radiusKm=50'
  $nearby = Invoke-RestMethod -Uri $nearbyUrl
  $card = $nearby.data | Where-Object { $_.id -eq $eventId } | Select-Object -First 1
}
Assert ($null -ne $card) 'Event appears in public list/nearby' 'not found'
if ($card) {
  Assert ($card.hasGift -eq $true) 'Public list hasGift' "got $($card.hasGift)"
  Assert ($card.giftCount -eq 3) 'Public list giftCount' "got $($card.giftCount)"
  Assert ($card.giftTeaser -eq 'Free drink') 'Public list giftTeaser' "got $($card.giftTeaser)"
  Assert (-not ($card.PSObject.Properties.Name -contains 'giftCodes')) 'Public list does not leak giftCodes' 'giftCodes present'
  $pubMsg = ($card.PSObject.Properties.Name -contains 'completionMessage') -and ($null -ne $card.completionMessage)
  Assert (-not $pubMsg) 'Public list does not leak completionMessage' 'completionMessage present'
}

$detail = Invoke-RestMethod -Uri "$base/events/$eventId"
Assert ($detail.data.hasGift -eq $true) 'Public detail hasGift' "got $($detail.data.hasGift)"
Assert ($detail.data.giftTeaser -eq 'Free drink') 'Public detail giftTeaser' "got $($detail.data.giftTeaser)"
Assert (-not ($detail.data.PSObject.Properties.Name -contains 'giftCodes')) 'Public detail does not leak giftCodes' 'giftCodes present'
$hasCompletionOnPublic = ($detail.data.PSObject.Properties.Name -contains 'completionMessage') -and ($null -ne $detail.data.completionMessage)
Assert (-not $hasCompletionOnPublic) 'Public detail does not expose completionMessage' 'completionMessage leaked'

Write-Host ''
Write-Host '--- Gift assign order ---' -ForegroundColor Cyan
$results = @()
for ($i = 0; $i -lt 4; $i++) {
  $r = PlayThroughEvent $players[$i].headers $places
  $results += $r.data
  Start-Sleep -Milliseconds 200
}

Assert ($results[0].eventCompleted -eq $true) 'Player1 completed' "eventCompleted=$($results[0].eventCompleted)"
Assert ($results[0].finishRank -eq 1) 'Player1 rank=1' "got $($results[0].finishRank)"
Assert ($results[0].giftCode -eq 'GIFT-FIRST') 'Player1 gets GIFT-FIRST' "got $($results[0].giftCode)"
Assert ($results[0].giftsAllClaimed -eq $false) 'Player1 giftsAllClaimed=false' "got $($results[0].giftsAllClaimed)"

Assert ($results[1].finishRank -eq 2) 'Player2 rank=2' "got $($results[1].finishRank)"
Assert ($results[1].giftCode -eq 'GIFT-SECOND') 'Player2 gets GIFT-SECOND' "got $($results[1].giftCode)"

Assert ($results[2].finishRank -eq 3) 'Player3 rank=3' "got $($results[2].finishRank)"
Assert ($results[2].giftCode -eq 'GIFT-THIRD') 'Player3 gets GIFT-THIRD' "got $($results[2].giftCode)"

Assert ($results[3].finishRank -eq 4) 'Player4 rank=4' "got $($results[3].finishRank)"
Assert ($null -eq $results[3].giftCode) 'Player4 no gift code' "got $($results[3].giftCode)"
Assert ($results[3].giftsAllClaimed -eq $true) 'Player4 giftsAllClaimed=true' "got $($results[3].giftsAllClaimed)"
Assert ($results[3].giftCount -eq 3) 'Player4 giftCount=3 for copy' "got $($results[3].giftCount)"
Assert ($results[3].completionMessage -like '*redeem*') 'Non-winner still gets completionMessage' 'missing'

Write-Host ''
Write-Host '--- Idempotent resubmit ---' -ForegroundColor Cyan
$lastPlace = $places[-1]
$againBody = @{
  answer = $lastPlace.answer
  latitude = $lastPlace.lat
  longitude = $lastPlace.lon
  accuracy = 10
  timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
} | ConvertTo-Json
$again = Invoke-RestMethod -Uri "$base/places/$($lastPlace.id)/answer" -Method POST -Headers $players[0].headers -ContentType 'application/json' -Body $againBody
Assert (($again.data.alreadyCompleted -eq $true) -or ($again.data.eventCompleted -eq $true)) 'Resubmit marks already completed' 'payload incomplete'
Assert ($again.data.finishRank -eq 1) 'Resubmit keeps rank 1' "got $($again.data.finishRank)"
Assert ($again.data.giftCode -eq 'GIFT-FIRST') 'Resubmit keeps same code' "got $($again.data.giftCode)"

Write-Host ''
Write-Host '--- Re-open completion ---' -ForegroundColor Cyan
$re1 = Invoke-RestMethod -Uri "$base/events/$eventId/completion" -Headers $players[0].headers
Assert ($re1.data.finishRank -eq 1) 'Re-open winner rank' "got $($re1.data.finishRank)"
Assert ($re1.data.giftCode -eq 'GIFT-FIRST') 'Re-open winner code' "got $($re1.data.giftCode)"

$re4 = Invoke-RestMethod -Uri "$base/events/$eventId/completion" -Headers $players[3].headers
Assert ($null -eq $re4.data.giftCode) 'Re-open non-winner no code' "got $($re4.data.giftCode)"
Assert ($re4.data.finishRank -eq 4) 'Re-open non-winner rank' "got $($re4.data.finishRank)"
Assert ($re4.data.giftsAllClaimed -eq $true) 'Re-open non-winner giftsAllClaimed' "got $($re4.data.giftsAllClaimed)"

$status = ApiErrorStatus {
  Invoke-RestMethod -Uri "$base/events/$eventId/completion" -Headers $demo.headers
}
Assert (($status -eq 403) -or ($status -eq 404)) 'Non-finisher blocked from completion' "expected 403/404 got $status"

Write-Host ''
Write-Host '--- Finishers ---' -ForegroundColor Cyan
$fin = Invoke-RestMethod -Uri "$base/events/$eventId/finishers" -Headers $admin.headers
Assert ($fin.data.giftCount -eq 3) 'Finishers giftCount' "got $($fin.data.giftCount)"
Assert ($fin.data.giftAssignedCount -eq 3) 'Finishers giftAssignedCount=3' "got $($fin.data.giftAssignedCount)"
Assert ($fin.data.finishers.Count -ge 4) 'Finishers list has >=4' "got $($fin.data.finishers.Count)"
$assignedCodes = @($fin.data.finishers | ForEach-Object { $_.giftCodeAwarded } | Where-Object { $_ })
Assert ((($assignedCodes | Select-Object -Unique).Count) -eq 3) 'Finishers unique assigned codes' ("codes=" + ($assignedCodes -join ','))

$status = ApiErrorStatus {
  Invoke-RestMethod -Uri "$base/events/$eventId/finishers" -Headers $players[0].headers
}
Assert ($status -eq 403) 'Non-owner blocked from finishers' "expected 403 got $status"

try {
  $parts = Invoke-RestMethod -Uri "$base/admin/events/$eventId/participants" -Headers $admin.headers
  $hasRank = $false
  if ($parts.data.event -and ($parts.data.event.PSObject.Properties.Name -contains 'giftAssignedCount')) {
    $hasRank = $true
  }
  $sample = $null
  if ($parts.data.participants) { $sample = $parts.data.participants | Select-Object -First 1 }
  elseif ($parts.data.items) { $sample = $parts.data.items | Select-Object -First 1 }
  if ($sample -and (($sample.PSObject.Properties.Name -contains 'finishRank') -or ($sample.PSObject.Properties.Name -contains 'giftCodeAwarded'))) {
    $hasRank = $true
  }
  Assert $hasRank 'Admin participants includes gift columns/summary' 'missing finishRank/gift fields'
} catch {
  Fail 'Admin participants gift columns' $_.Exception.Message
}

Write-Host ''
Write-Host '--- Edit freeze ---' -ForegroundColor Cyan
$status = ApiErrorStatus {
  $body = @{ giftCodes = @('GIFT-FIRST', 'CHANGED', 'GIFT-THIRD'); giftTeaser = 'Free drink' } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/events/$eventId" -Method PATCH -Headers $admin.headers -ContentType 'application/json' -Body $body
}
Assert ($status -eq 400) 'Cannot change existing code slot' "expected 400 got $status"

$status = ApiErrorStatus {
  $body = @{ giftCodes = @('GIFT-FIRST', 'GIFT-SECOND'); giftTeaser = 'Free drink' } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/events/$eventId" -Method PATCH -Headers $admin.headers -ContentType 'application/json' -Body $body
}
Assert ($status -eq 400) 'Cannot remove trailing codes' "expected 400 got $status"

try {
  $body = @{
    giftCodes = @('GIFT-FIRST', 'GIFT-SECOND', 'GIFT-THIRD', 'GIFT-FOURTH')
    giftTeaser = 'Free drink'
  } | ConvertTo-Json
  $patched = Invoke-RestMethod -Uri "$base/events/$eventId" -Method PATCH -Headers $admin.headers -ContentType 'application/json' -Body $body
  Assert ($patched.data.giftCount -eq 4) 'Can append unused code' "got $($patched.data.giftCount)"
} catch {
  Fail 'Can append unused code' $_.Exception.Message
}

Write-Host ''
Write-Host '--- Zero gifts ---' -ForegroundColor Cyan
$zero = New-GiftEvent $admin.headers ("Gift QA Zero $(Get-Random)") $null 'Thanks for playing!' @()
Assert ($zero.created.hasGift -eq $false) 'Zero-gift hasGift=false' "got $($zero.created.hasGift)"
Assert ($zero.created.giftCount -eq 0) 'Zero-gift giftCount=0' "got $($zero.created.giftCount)"

$email = "giftzero-$(Get-Random)@example.com"
$reg = Invoke-RestMethod -Uri "$base/auth/register" -Method POST -ContentType 'application/json' -Body (@{
  email = $email; password = 'Test1234!'; name = 'ZeroGift'
} | ConvertTo-Json)
$zh = @{ Authorization = "Bearer $($reg.data.tokens.accessToken)" }
$zr = PlayThroughEvent $zh @(@{ id = $zero.placeId; lat = 37.7879; lon = -122.4075; answer = '1850' })
Assert ($zr.data.eventCompleted -eq $true) 'Zero-gift completes' 'not completed'
Assert ($null -eq $zr.data.giftCode) 'Zero-gift no code' "got $($zr.data.giftCode)"
Assert ($zr.data.giftsAllClaimed -eq $false) 'Zero-gift giftsAllClaimed=false' "got $($zr.data.giftsAllClaimed)"
Assert ($zr.data.completionMessage -eq 'Thanks for playing!') 'Zero-gift still returns message' "got $($zr.data.completionMessage)"

Write-Host ''
Write-Host '--- Concurrent finish ---' -ForegroundColor Cyan
$race = New-GiftEvent $admin.headers ("Gift QA Race $(Get-Random)") 'Merch' 'Redeem at desk.' @('RACE-A', 'RACE-B')
$racePlaceId = $race.placeId
$racerTokens = @()
for ($i = 1; $i -le 2; $i++) {
  $email = "giftrace$i-$(Get-Random)@example.com"
  $reg = Invoke-RestMethod -Uri "$base/auth/register" -Method POST -ContentType 'application/json' -Body (@{
    email = $email; password = 'Test1234!'; name = "Racer$i"
  } | ConvertTo-Json)
  $token = $reg.data.tokens.accessToken
  $h = @{ Authorization = "Bearer $token" }
  $ub = @{ latitude = 37.7879; longitude = -122.4075 } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/places/$racePlaceId/unlock" -Method POST -Headers $h -ContentType 'application/json' -Body $ub | Out-Null
  $racerTokens += $token
}

$answerJson = @{
  answer = '1850'
  latitude = 37.7879
  longitude = -122.4075
  accuracy = 10
  timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
} | ConvertTo-Json

$jobs = @()
foreach ($token in $racerTokens) {
  $jobs += Start-Job -ScriptBlock {
    param($baseUrl, $accessToken, $placeId, $body)
    $headers = @{ Authorization = "Bearer $accessToken" }
    Invoke-RestMethod -Uri "$baseUrl/places/$placeId/answer" -Method POST -Headers $headers -ContentType 'application/json' -Body $body
  } -ArgumentList $base, $token, $racePlaceId, $answerJson
}
Wait-Job $jobs | Out-Null
$raceResults = @()
foreach ($j in $jobs) {
  $raceResults += ,(Receive-Job $j)
}
$jobs | Remove-Job -Force

$ranks = @($raceResults | ForEach-Object { $_.data.finishRank })
$codes = @($raceResults | ForEach-Object { $_.data.giftCode })
Assert ((($ranks | Select-Object -Unique).Count) -eq 2) 'Concurrent unique ranks' ("ranks=" + ($ranks -join ','))
Assert ((($codes | Select-Object -Unique).Count) -eq 2) 'Concurrent unique codes' ("codes=" + ($codes -join ','))
Assert (($codes -contains 'RACE-A') -and ($codes -contains 'RACE-B')) 'Concurrent got both race codes' ("codes=" + ($codes -join ','))

Write-Host ''
$color = if ($fail -eq 0) { 'Green' } else { 'Red' }
Write-Host "=== Results: $pass passed, $fail failed ===" -ForegroundColor $color
Write-Host ''
if ($findings.Count -gt 0) {
  Write-Host 'Findings:' -ForegroundColor Yellow
  foreach ($f in $findings) { Write-Host " - $f" }
}
exit $(if ($fail -gt 0) { 1 } else { 0 })
