# SANAD local demo launcher + watchdog (Windows / PowerShell).
#
# Starts Docker PostgreSQL/Redis, the compiled NestJS API, and a tunnel.
# The tunnel can be:
#   - ngrok       (recommended: stable free dev domain)
#   - cloudflared (quick tunnel; URL changes on every restart)
#   - none        (local API only)
#
# Examples:
#   pnpm demo:start
#   pnpm demo:start -- -Tunnel ngrok -NgrokDomain sanad-demo.ngrok.app -Watch
#   pnpm demo:start -- -Rebuild
#   pnpm demo:start -- -NoTunnel
#
# Secrets are never printed and never written to this repo. The ngrok
# authtoken must be installed once with:
#   ngrok config add-authtoken <token>
# Do not paste the token into chat, source, or logs.

[CmdletBinding()]
param(
  [ValidateSet("ngrok", "cloudflared", "none")]
  [string]$Tunnel = "cloudflared",
  [string]$NgrokDomain = $env:NGROK_DOMAIN,
  [int]$ApiPort = 3002,
  [string]$PublicHost = "sanad-edtech.vercel.app",
  [string]$WebOrigin = "https://sanad-edtech.vercel.app",
  [switch]$Rebuild,
  [switch]$Watch,
  [switch]$NoTunnel,
  [int]$WatchIntervalSeconds = 30
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

if ($NoTunnel) { $Tunnel = "none" }

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $repoRoot

$stateDir = Join-Path $env:TEMP "sanad-local"
$apiPidFile = Join-Path $stateDir "api.pid"
$tunnelPidFile = Join-Path $stateDir "tunnel.pid"
$tunnelUrlFile = Join-Path $stateDir "tunnel.url"
$stateFile = Join-Path $stateDir "demo-state.json"
$apiOut = Join-Path $stateDir "api.out.log"
$apiErr = Join-Path $stateDir "api.err.log"
$tunnelOut = Join-Path $stateDir "tunnel.out.log"
$tunnelErr = Join-Path $stateDir "tunnel.err.log"

New-Item -ItemType Directory -Force -Path $stateDir | Out-Null

$dbUrl = "postgresql://postgres:postgres@127.0.0.1:5432/learning_platform?schema=public"
$allowedOrigins = "$WebOrigin,http://localhost:3001,http://127.0.0.1:3001"

$script:ApiPid = 0
$script:TunnelPid = 0
$script:PublicUrl = $null

function Write-Step([string]$Message) {
  Write-Host "[demo] $Message" -ForegroundColor Cyan
}

function Write-DemoWarning([string]$Message) {
  Write-Warning "[demo] $Message"
}

function Test-DockerEngine {
  docker info *> $null
  return $LASTEXITCODE -eq 0
}

function Ensure-Docker {
  if (Test-DockerEngine) { return }

  $candidates = @(
    (Join-Path $env:LOCALAPPDATA "Programs\DockerDesktop\Docker Desktop.exe"),
    "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  )
  $dockerExe = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if (-not $dockerExe) {
    throw "Docker Desktop was not found. Start Docker manually and retry."
  }

  Write-Step "Starting Docker Desktop..."
  Start-Process -FilePath $dockerExe -WindowStyle Minimized | Out-Null
  for ($i = 1; $i -le 60; $i++) {
    Start-Sleep -Seconds 5
    if (Test-DockerEngine) { return }
  }
  throw "Docker engine did not become ready in 5 minutes."
}

function Ensure-Containers {
  Ensure-Docker
  Write-Step "Starting PostgreSQL and Redis..."
  docker compose up -d postgres redis
  if ($LASTEXITCODE -ne 0) { throw "docker compose up failed." }

  $pgReady = $false
  for ($i = 1; $i -le 45; $i++) {
    docker exec learning-platform-db pg_isready -U postgres *> $null
    if ($LASTEXITCODE -eq 0) {
      $pgReady = $true
      break
    }
    Start-Sleep -Seconds 2
  }
  if (-not $pgReady) { throw "PostgreSQL did not become ready." }

  $redisReady = $false
  for ($i = 1; $i -le 30; $i++) {
    $pong = docker exec learning-platform-redis redis-cli ping 2>$null
    if ($pong -match "PONG") {
      $redisReady = $true
      break
    }
    Start-Sleep -Seconds 2
  }
  if (-not $redisReady) { throw "Redis did not become ready." }
}

function Ensure-ApiBuild {
  $apiEntry = Join-Path $repoRoot "apps\api\dist\src\main.js"
  if (-not $Rebuild -and (Test-Path $apiEntry)) { return }

  Write-Step "Generating Prisma client..."
  pnpm --filter api exec prisma generate
  if ($LASTEXITCODE -ne 0) { throw "prisma generate failed." }

  Write-Step "Building the API..."
  pnpm --filter api run build
  if ($LASTEXITCODE -ne 0) { throw "API build failed." }
}

function Ensure-LocalEnv {
  $rootEnv = Join-Path $repoRoot ".env.local"
  if (Test-Path $rootEnv) { return }

  Write-Step "Creating local-only .env.local (gitignored)..."
  $jwt = [guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
  $videoToken = [guid]::NewGuid().ToString("N")
  $videoHmac = [guid]::NewGuid().ToString("N")
  $content = @"
DATABASE_URL="$dbUrl"
MIGRATION_DATABASE_URL="$dbUrl"
JWT_SECRET="$jwt"
VIDEO_TOKEN_SECRET="$videoToken"
VIDEO_WATERMARK_HMAC_SECRET="$videoHmac"
ALLOWED_ORIGINS="$allowedOrigins"
NODE_ENV="production"
PORT="$ApiPort"
LOG_LEVEL="info"
"@
  Set-Content -Path $rootEnv -Value $content -Encoding UTF8
}

function Stop-PidFile([string]$Path) {
  if (-not (Test-Path $Path)) { return }
  $pidText = Get-Content $Path -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($pidText -and $pidText -match "^\d+$") {
    Stop-Process -Id ([int]$pidText) -Force -ErrorAction SilentlyContinue
  }
  Remove-Item $Path -Force -ErrorAction SilentlyContinue
}

function Test-ProcessRunning([int]$ProcessId) {
  if ($ProcessId -le 0) { return $false }
  return [bool](Get-Process -Id $ProcessId -ErrorAction SilentlyContinue)
}

function Test-ApiHealth {
  $body = curl.exe -sS --max-time 5 "http://localhost:$ApiPort/api/health" 2>$null
  if ($LASTEXITCODE -ne 0) { return $false }
  return ($body -match '"status"\s*:\s*"ok"')
}

function Wait-ApiHealthy([int]$Attempts = 30) {
  for ($i = 1; $i -le $Attempts; $i++) {
    Start-Sleep -Seconds 2
    if (Test-ApiHealth) { return $true }
  }
  return $false
}

function Get-PortOwnerPid([int]$Port) {
  try {
    $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
      Select-Object -First 1
    if ($connection) { return [int]$connection.OwningProcess }
  } catch {
    # Get-NetTCPConnection is unavailable on some minimal Windows images.
  }
  return 0
}

function Start-Api {
  $portOwner = Get-PortOwnerPid $ApiPort
  if ($portOwner -gt 0 -and -not $Rebuild -and (Test-ApiHealth)) {
    $portOwner | Set-Content $apiPidFile
    $script:ApiPid = $portOwner
    Write-Step "API already healthy on port $ApiPort (PID $portOwner); reusing it."
    return
  }

  if ($portOwner -gt 0) {
    Write-DemoWarning "Stopping process $portOwner on port $ApiPort before restart."
    Stop-Process -Id $portOwner -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
  }

  Stop-PidFile $apiPidFile
  Remove-Item $apiOut, $apiErr -Force -ErrorAction SilentlyContinue

  $env:DATABASE_URL = $dbUrl
  $env:MIGRATION_DATABASE_URL = $dbUrl
  $env:ALLOWED_ORIGINS = $allowedOrigins
  $env:NODE_ENV = "production"
  $env:PORT = "$ApiPort"
  $env:LOG_LEVEL = "info"

  $api = Start-Process -FilePath "node" `
    -ArgumentList "apps/api/dist/src/main.js" `
    -WorkingDirectory $repoRoot `
    -RedirectStandardOutput $apiOut `
    -RedirectStandardError $apiErr `
    -WindowStyle Hidden `
    -PassThru
  $api.Id | Set-Content $apiPidFile
  $script:ApiPid = $api.Id
  Write-Step "API PID $($api.Id) started."

  if (-not (Wait-ApiHealthy 30)) {
    Write-Host "API health failed. Recent logs:" -ForegroundColor Red
    Get-Content $apiOut -Tail 40 -ErrorAction SilentlyContinue
    Get-Content $apiErr -Tail 40 -ErrorAction SilentlyContinue
    throw "API did not become healthy."
  }
  Write-Step "API health: OK"
}

function Test-TenantDomain {
  $check = docker exec learning-platform-db psql -U postgres -d learning_platform -Atc "SELECT 1 FROM tenant_domains WHERE domain = '$PublicHost';" 2>$null
  if ($LASTEXITCODE -ne 0) {
    Write-DemoWarning "Could not verify tenant_domains in PostgreSQL."
    return
  }
  if ($check -ne "1") {
    Write-DemoWarning "The local database is missing the '$PublicHost' tenant domain."
    Write-DemoWarning "Run the seed with PROD_TENANT_DOMAINS='$PublicHost' before using the tunnel."
  }
}

function Get-Cloudflared {
  $cf = Join-Path $stateDir "cloudflared.exe"
  if (Test-Path $cf) { return $cf }

  Write-Step "Downloading cloudflared..."
  Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $cf -UseBasicParsing
  return $cf
}

function Get-Ngrok {
  $command = Get-Command ngrok -ErrorAction SilentlyContinue
  if ($command) { return $command.Source }

  $ngrok = Join-Path $stateDir "ngrok.exe"
  if (Test-Path $ngrok) { return $ngrok }

  Write-Step "Downloading ngrok..."
  $zip = Join-Path $stateDir "ngrok.zip"
  Invoke-WebRequest -Uri "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip" -OutFile $zip -UseBasicParsing
  Expand-Archive -Path $zip -DestinationPath $stateDir -Force
  if (-not (Test-Path $ngrok)) { throw "ngrok download did not produce ngrok.exe." }
  return $ngrok
}

function Start-Cloudflared {
  Stop-PidFile $tunnelPidFile
  Remove-Item $tunnelOut, $tunnelErr -Force -ErrorAction SilentlyContinue
  $cf = Get-Cloudflared

  $argList = @(
    "tunnel",
    "--url", "http://localhost:$ApiPort",
    "--http-host-header", $PublicHost,
    "--no-autoupdate"
  )
  $tunnel = Start-Process -FilePath $cf -ArgumentList $argList `
    -WorkingDirectory $repoRoot `
    -RedirectStandardOutput $tunnelOut `
    -RedirectStandardError $tunnelErr `
    -WindowStyle Hidden `
    -PassThru
  $tunnel.Id | Set-Content $tunnelPidFile
  $script:TunnelPid = $tunnel.Id

  $url = $null
  for ($i = 1; $i -le 30; $i++) {
    Start-Sleep -Seconds 2
    $text = (Get-Content $tunnelOut -Raw -ErrorAction SilentlyContinue) + (Get-Content $tunnelErr -Raw -ErrorAction SilentlyContinue)
    $match = [regex]::Match($text, "https://[a-zA-Z0-9-]+\.trycloudflare\.com")
    if ($match.Success) { $url = $match.Value; break }
  }
  if (-not $url) {
    Get-Content $tunnelErr -Tail 40 -ErrorAction SilentlyContinue
    throw "Cloudflare Tunnel URL was not found."
  }

  $url | Set-Content $tunnelUrlFile
  $script:PublicUrl = $url
  Write-Step "Cloudflare quick tunnel: $url"
}

function Start-Ngrok {
  Stop-PidFile $tunnelPidFile
  Remove-Item $tunnelOut, $tunnelErr -Force -ErrorAction SilentlyContinue
  $ngrok = Get-Ngrok

  $configCheck = & $ngrok config check 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "ngrok is not authenticated. Run 'ngrok config add-authtoken <token>' once, then retry. Never commit or paste the token."
  }

  if (-not $NgrokDomain) {
    Write-DemoWarning "No -NgrokDomain / NGROK_DOMAIN set. The ngrok URL will change on every restart."
    Write-DemoWarning "Claim a free static domain in the ngrok dashboard and set NGROK_DOMAIN for a stable URL."
  }

  $argList = @("http", "$ApiPort", "--host-header=$PublicHost")
  if ($NgrokDomain) { $argList += "--domain=$NgrokDomain" }

  $tunnel = Start-Process -FilePath $ngrok -ArgumentList $argList `
    -WorkingDirectory $repoRoot `
    -RedirectStandardOutput $tunnelOut `
    -RedirectStandardError $tunnelErr `
    -WindowStyle Hidden `
    -PassThru
  $tunnel.Id | Set-Content $tunnelPidFile
  $script:TunnelPid = $tunnel.Id

  if ($NgrokDomain) {
    $script:PublicUrl = "https://$NgrokDomain"
  } else {
    $script:PublicUrl = $null
    for ($i = 1; $i -le 30; $i++) {
      Start-Sleep -Seconds 2
      try {
        $tunnels = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 3
        $https = $tunnels.tunnels | Where-Object { $_.public_url -like "https://*" } | Select-Object -First 1
        if ($https) { $script:PublicUrl = $https.public_url; break }
      } catch {
        # ngrok local API may not be ready yet.
      }
    }
    if (-not $script:PublicUrl) {
      Get-Content $tunnelErr -Tail 40 -ErrorAction SilentlyContinue
      throw "ngrok URL was not found."
    }
  }

  $script:PublicUrl | Set-Content $tunnelUrlFile
  Write-Step "ngrok tunnel: $($script:PublicUrl)"
}

function Start-Tunnel {
  if ($Tunnel -eq "none") { return }
  if ($Tunnel -eq "ngrok") { Start-Ngrok; return }
  Start-Cloudflared
}

function Write-DemoState {
  $state = [ordered]@{
    provider = $Tunnel
    publicUrl = $script:PublicUrl
    apiPort = $ApiPort
    publicHost = $PublicHost
    startedAt = (Get-Date).ToString("o")
  }
  $state | ConvertTo-Json | Set-Content $stateFile -Encoding UTF8
}

function Show-DemoSummary {
  Write-Host ""
  Write-Host "Local API:   http://localhost:$ApiPort/api/health" -ForegroundColor Green
  if ($script:PublicUrl) {
    Write-Host "Public API:  $script:PublicUrl" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vercel -> Settings -> Environment Variables -> API_PROXY_TARGET (Production):"
    Write-Host "  $script:PublicUrl"
    Write-Host "Redeploy once. Do not use NEXT_PUBLIC_API_URL."
    if ($Tunnel -eq "cloudflared") {
      Write-Host ""
      Write-Host "This is a quick tunnel: the URL changes on every restart." -ForegroundColor Yellow
      Write-Host "Use -Tunnel ngrok with a free static domain for a stable demo." -ForegroundColor Yellow
    }
  } else {
    Write-Host "Tunnel disabled. Local API only." -ForegroundColor Yellow
  }
  Write-Host ""
  Write-Host "State and logs: $stateDir"
}

function Watch-Demo {
  Write-Step "Watchdog enabled (every $WatchIntervalSeconds seconds). Press Ctrl+C to stop."
  while ($true) {
    Start-Sleep -Seconds $WatchIntervalSeconds
    try {
      if (-not (Test-ApiHealth)) {
        Write-DemoWarning "API health failed. Checking Docker and restarting the API..."
        Ensure-Containers
        Start-Api
      }

      if ($Tunnel -ne "none" -and -not (Test-ProcessRunning $script:TunnelPid)) {
        Write-DemoWarning "Tunnel process is not running. Restarting it..."
        $previousUrl = $script:PublicUrl
        Start-Tunnel
        if ($previousUrl -and $script:PublicUrl -ne $previousUrl) {
          Write-DemoWarning "Tunnel URL changed: $previousUrl -> $($script:PublicUrl)"
          Write-DemoWarning "Update Vercel API_PROXY_TARGET and redeploy, or use a stable ngrok domain."
        }
      }

      Write-DemoState
    } catch {
      Write-DemoWarning "Watchdog iteration failed: $($_.Exception.Message)"
    }
  }
}

try {
  Ensure-Docker
  Ensure-Containers
  Ensure-ApiBuild
  Ensure-LocalEnv

  Write-Step "Starting API..."
  Start-Api
  Test-TenantDomain

  Write-Step "Starting tunnel ($Tunnel)..."
  Start-Tunnel
  Write-DemoState
  Show-DemoSummary

  if ($Watch) { Watch-Demo }
} catch {
  Write-Host ""
  Write-Host "Demo startup failed: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "Logs: $stateDir"
  exit 1
}
