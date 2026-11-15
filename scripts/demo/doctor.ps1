[CmdletBinding()]
param(
  [string]$BaseUrl = "https://sanad-edtech.vercel.app"
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$stateDir = Join-Path $env:TEMP "sanad-local"
$tunnelFile = Join-Path $stateDir "tunnel.url"
$checks = 0
$failures = 0

function Write-Check {
  param(
    [string]$Name,
    [bool]$Ok,
    [string]$Detail = ""
  )
  $script:checks++
  if ($Ok) {
    Write-Output "[PASS] $Name"
    return
  }
  $script:failures++
  if ($Detail) {
    Write-Output "[FAIL] $Name - $Detail"
  } else {
    Write-Output "[FAIL] $Name"
  }
}

function Test-Http {
  param(
    [string]$Url,
    [int]$TimeoutSec = 15
  )
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec
    return @{
      Ok = ($response.StatusCode -eq 200)
      Status = [int]$response.StatusCode
      Content = $response.Content
    }
  } catch {
    return @{
      Ok = $false
      Status = 0
      Content = $_.Exception.Message
    }
  }
}

function Short-Hash {
  param([string]$Value)
  if (-not $Value) { return "" }
  if ($Value.Length -le 7) { return $Value }
  return $Value.Substring(0, 7)
}

function Get-DbScalar {
  param([string]$Sql)
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $raw = & docker exec learning-platform-db psql -U postgres -d learning_platform -At -c $Sql 2>&1
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previous
  }
  if ($exitCode -ne 0) { return "" }
  return (($raw | Out-String).Trim())
}

Write-Output "SANAD demo doctor: $BaseUrl"

# 1) Docker engine and the two demo containers.
$dockerOk = $false
try {
  docker info *> $null
  $dockerOk = ($LASTEXITCODE -eq 0)
} catch {
  $dockerOk = $false
}
$demoContainers = @()
if ($dockerOk) {
  $names = @(docker ps --format "{{.Names}}" 2>$null)
  $demoContainers = @($names | Where-Object { $_ -in @("learning-platform-db", "learning-platform-redis") })
}
Write-Check "Docker engine and demo containers" ($dockerOk -and $demoContainers.Count -eq 2) "docker=$dockerOk containers=$($demoContainers -join ',')"

# 2) Local API health.
$local = Test-Http "http://localhost:3002/api/health"
Write-Check "Local API health" $local.Ok "status=$($local.Status)"

# 3) Cloudflare quick-tunnel health.
$tunnel = ""
if (Test-Path $tunnelFile) {
  $tunnel = (Get-Content $tunnelFile -Raw).Trim()
}
$tunnelHealth = @{ Ok = $false; Status = 0 }
if ($tunnel) {
  $tunnelHealth = Test-Http "$tunnel/api/health"
}
Write-Check "Tunnel health" $tunnelHealth.Ok "tunnel=$tunnel status=$($tunnelHealth.Status)"

# 4) Live web health and database.
$live = Test-Http (($BaseUrl.TrimEnd("/")) + "/api/health")
$liveOk = $false
$databaseOk = $false
if ($live.Ok) {
  try {
    $json = $live.Content | ConvertFrom-Json
    $liveOk = ($json.status -eq "ok")
    if ($json.database) {
      $databaseOk = ($json.database -eq "up")
    } elseif ($json.info -and $json.info.database) {
      $databaseOk = ($json.info.database.status -eq "up")
    }
  } catch {
    $liveOk = $false
  }
}
Write-Check "Live web health and database" ($live.Ok -and $liveOk -and $databaseOk) "status=$($live.Status) db=$databaseOk"

# 5) Public judge pages.
$demo = Test-Http (($BaseUrl.TrimEnd("/")) + "/demo")
$checkout = Test-Http (($BaseUrl.TrimEnd("/")) + "/checkout/arabic-3-prep")
Write-Check "Judge pages /demo and checkout" ($demo.Ok -and $checkout.Ok) "demo=$($demo.Status) checkout=$($checkout.Status)"

# 6) Hidden watchdog.
$watchdogs = @(Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" | Where-Object {
    $_.CommandLine -match "start\.ps1" -and $_.CommandLine -match "-Watch"
  })
Write-Check "Watchdog is running" ($watchdogs.Count -gt 0) "count=$($watchdogs.Count)"

# 7) Git main must be clean and identical to origin/main.
$branch = [string](git -C $repoRoot rev-parse --abbrev-ref HEAD 2>$null | Select-Object -First 1)
$head = [string](git -C $repoRoot rev-parse HEAD 2>$null | Select-Object -First 1)
$remote = [string](git -C $repoRoot rev-parse origin/main 2>$null | Select-Object -First 1)
$dirty = @(git -C $repoRoot status --porcelain 2>$null | Where-Object { $_ -and $_ -notmatch "^\?\?" })
$gitOk = ($branch.Trim() -eq "main" -and $head.Trim() -and $remote.Trim() -and $head.Trim() -eq $remote.Trim() -and $dirty.Count -eq 0)
Write-Check "Git main is synced and clean" $gitOk "branch=$($branch.Trim()) head=$(Short-Hash $head.Trim()) remote=$(Short-Hash $remote.Trim()) tracked_changes=$($dirty.Count)"

# 8) The deployed fallback must match the live tunnel.
$configPath = Join-Path $repoRoot "apps\web\next.config.mjs"
$fallback = ""
if (Test-Path $configPath) {
  $content = Get-Content $configPath -Raw
  $match = [regex]::Match($content, 'FALLBACK_DEMO_TUNNEL_ORIGIN\s*=\s*\r?\n\s*"([^"]+)"')
  if ($match.Success) {
    $fallback = $match.Groups[1].Value
  }
}
Write-Check "Fallback matches the live tunnel" ($tunnel -and $fallback -eq $tunnel) "fallback=$fallback tunnel=$tunnel"

# 9) Demo database state: free course enrolled, paid course unenrolled, no money rows.
$dbOk = $false
$dbDetail = "not checked"
if ($dockerOk) {
  $published = Get-DbScalar "SELECT count(*) FROM courses WHERE status='PUBLISHED';"
  $enrollments = Get-DbScalar "SELECT count(*) FROM enrollments;"
  $paidSql = 'SELECT count(*) FROM enrollments WHERE (row_to_json(enrollments)->>''courseId'') = (SELECT id FROM courses WHERE slug = ''arabic-3-prep'');'
  $paid = Get-DbScalar $paidSql
  $orders = Get-DbScalar "SELECT count(*) FROM orders;"
  $payments = Get-DbScalar "SELECT count(*) FROM payments;"
  $redemptions = Get-DbScalar "SELECT count(*) FROM voucher_redemptions;"
  $dbDetail = "published=$published enrollments=$enrollments paid=$paid orders=$orders payments=$payments redemptions=$redemptions"
  $dbOk = ($published -eq "3" -and $enrollments -eq "1" -and $paid -eq "0" -and $orders -eq "0" -and $payments -eq "0" -and $redemptions -eq "0")
}
Write-Check "Demo database state" $dbOk $dbDetail

Write-Output ""
if ($failures -eq 0) {
  Write-Output "Doctor passed: $checks checks."
  exit 0
}
Write-Output "Doctor failed: $failures of $checks checks."
exit 1
