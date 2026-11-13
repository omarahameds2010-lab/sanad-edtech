# Judge-path smoke test for the local/live SANAD demo.
#
# It checks the public health endpoint, tenant resolution, teacher login,
# teacher courses, student login, student assignments, and student enrollments.
#
# Credentials are read from environment variables only; this file never stores
# or prints a password:
#   $env:DEMO_TEACHER_PHONE = "<teacher phone>"
#   $env:DEMO_TEACHER_PASSWORD = "..."
#   $env:DEMO_STUDENT_PHONE = "<student phone>"
#   $env:DEMO_STUDENT_PASSWORD = "..."
#
# Usage:
#   pnpm demo:smoke
#   pnpm demo:smoke -- -BaseUrl https://sanad-edtech.vercel.app
#
# If credentials are omitted, the script still checks public health and public
# courses and reports the authenticated checks as skipped.

[CmdletBinding()]
param(
  [string]$BaseUrl = "http://localhost:3002",
  [string]$HostHeader = "sanad-edtech.vercel.app",
  [string]$Origin = "https://sanad-edtech.vercel.app",
  [string]$TeacherPhone = $env:DEMO_TEACHER_PHONE,
  [string]$TeacherPassword = $env:DEMO_TEACHER_PASSWORD,
  [string]$StudentPhone = $env:DEMO_STUDENT_PHONE,
  [string]$StudentPassword = $env:DEMO_STUDENT_PASSWORD
)

$ErrorActionPreference = "Stop"
$BaseUrl = $BaseUrl.TrimEnd("/")
$stateDir = Join-Path $env:TEMP "sanad-local"
New-Item -ItemType Directory -Force -Path $stateDir | Out-Null

$script:Checks = 0
$script:Failures = 0

function Write-Check([string]$Name, [bool]$Ok, [string]$Detail = "") {
  $script:Checks++
  if ($Ok) {
    Write-Host "[PASS] $Name" -ForegroundColor Green
    return
  }
  $script:Failures++
  if ($Detail) {
    Write-Host "[FAIL] $Name - $Detail" -ForegroundColor Red
  } else {
    Write-Host "[FAIL] $Name" -ForegroundColor Red
  }
}

function Write-Skip([string]$Name, [string]$Reason) {
  Write-Host "[SKIP] $Name - $Reason" -ForegroundColor DarkYellow
}

function Invoke-JsonRequest {
  param(
    [string]$Method = "GET",
    [string]$Path,
    [string]$Token,
    [object]$Body
  )

  $responseFile = Join-Path $stateDir ("smoke-{0}.json" -f [guid]::NewGuid().ToString("N"))
  $bodyFile = $null
  $argList = @(
    "-sS",
    "--max-time", "15",
    "-o", $responseFile,
    "-w", "%{http_code}",
    "-X", $Method,
    "-H", "Origin: $Origin",
    "-H", "Accept: application/json"
  )

  if ($BaseUrl -match "^https?://(localhost|127\.0\.0\.1)") {
    $argList += @("-H", "Host: $HostHeader")
  }
  if ($Token) {
    $argList += @("-H", "Authorization: Bearer $Token")
  }
  if ($null -ne $Body) {
    $bodyFile = Join-Path $stateDir ("smoke-{0}.body.json" -f [guid]::NewGuid().ToString("N"))
    $jsonBody = $Body | ConvertTo-Json -Compress
    [System.IO.File]::WriteAllText($bodyFile, $jsonBody, [System.Text.UTF8Encoding]::new($false))
    $argList += @("-H", "Content-Type: application/json", "--data-binary", "@$bodyFile")
  }

  $argList += "$BaseUrl$Path"
  $statusText = & curl.exe @argList
  $curlExit = $LASTEXITCODE
  $raw = $null
  if (Test-Path $responseFile) {
    $raw = Get-Content $responseFile -Raw -ErrorAction SilentlyContinue
  }
  $json = $null
  if ($raw) {
    try { $json = $raw | ConvertFrom-Json } catch { $json = $null }
  }
  $statusCode = 0
  if ($statusText -match "^\d+$") {
    $statusCode = [int]$statusText
  }

  Remove-Item $responseFile -Force -ErrorAction SilentlyContinue
  if ($bodyFile) {
    Remove-Item $bodyFile -Force -ErrorAction SilentlyContinue
  }

  return [pscustomobject]@{
    StatusCode = $statusCode
    Json = $json
    Raw = $raw
    ExitCode = $curlExit
  }
}

Write-Host "SANAD demo smoke: $BaseUrl" -ForegroundColor Cyan
Write-Host ""

$health = Invoke-JsonRequest -Path "/api/health"
$healthOk = $health.StatusCode -eq 200 -and $health.Json -and $health.Json.status -eq "ok"
$dbOk = $health.Raw -match '"database"\s*:\s*\{\s*"status"\s*:\s*"up"'
Write-Check "API health is 200 and database is up" ($healthOk -and $dbOk) "status=$($health.StatusCode)"

$publicCourses = Invoke-JsonRequest -Path "/api/v1/public/courses"
$publicCoursesOk = $publicCourses.StatusCode -eq 200 -and $publicCourses.Json -and ($publicCourses.Json.data -or $publicCourses.Json.courses)
Write-Check "Public course catalog responds" $publicCoursesOk "status=$($publicCourses.StatusCode)"

$teacherToken = $null
if (-not $TeacherPhone -or -not $TeacherPassword) {
  Write-Skip "Teacher login" "DEMO_TEACHER_PHONE / DEMO_TEACHER_PASSWORD not set"
} else {
  $teacherLogin = Invoke-JsonRequest -Method "POST" -Path "/api/auth/login" -Body @{
    phone = $TeacherPhone
    password = $TeacherPassword
  }
  $teacherToken = $teacherLogin.Json.accessToken
  $teacherOk = $teacherLogin.StatusCode -eq 200 -and $teacherToken -and $teacherLogin.Json.user.role -eq "TEACHER"
  Write-Check "Teacher login returns a TEACHER access token" $teacherOk "status=$($teacherLogin.StatusCode)"
}

if ($teacherToken) {
  $tenant = Invoke-JsonRequest -Path "/api/tenants/current" -Token $teacherToken
  $tenantOk = $tenant.StatusCode -eq 200 -and $tenant.Json.slug
  Write-Check "Tenant resolves for the teacher" $tenantOk "status=$($tenant.StatusCode)"

  $courses = Invoke-JsonRequest -Path "/api/v1/teacher/courses" -Token $teacherToken
  $courseCount = 0
  if ($courses.Json.data) {
    $courseCount = @($courses.Json.data).Count
  }
  Write-Check "Teacher course list responds with data" ($courses.StatusCode -eq 200 -and $courseCount -gt 0) "status=$($courses.StatusCode), courses=$courseCount"
}

$studentToken = $null
if (-not $StudentPhone -or -not $StudentPassword) {
  Write-Skip "Student login" "DEMO_STUDENT_PHONE / DEMO_STUDENT_PASSWORD not set"
} else {
  $studentLogin = Invoke-JsonRequest -Method "POST" -Path "/api/auth/login" -Body @{
    phone = $StudentPhone
    password = $StudentPassword
  }
  $studentToken = $studentLogin.Json.accessToken
  $studentOk = $studentLogin.StatusCode -eq 200 -and $studentToken -and $studentLogin.Json.user.role -eq "STUDENT"
  Write-Check "Student login returns a STUDENT access token" $studentOk "status=$($studentLogin.StatusCode)"
}

if ($studentToken) {
  $assignments = Invoke-JsonRequest -Path "/api/v1/assignments" -Token $studentToken
  Write-Check "Student assignment list responds" ($assignments.StatusCode -eq 200) "status=$($assignments.StatusCode)"

  $enrollments = Invoke-JsonRequest -Path "/api/v1/enrollments/me" -Token $studentToken
  Write-Check "Student enrollments respond" ($enrollments.StatusCode -eq 200) "status=$($enrollments.StatusCode)"
}

Write-Host ""
if ($script:Failures -gt 0) {
  Write-Host "Smoke failed: $script:Failures of $script:Checks checks." -ForegroundColor Red
  exit 1
}

Write-Host "Smoke passed: $script:Checks checks." -ForegroundColor Green
