# Stop the local SANAD demo processes started by scripts/demo/start.ps1.
#
# Usage:
#   pnpm demo:stop
#   pnpm demo:stop -- -StopDocker
#   pnpm demo:stop -- -Clean

[CmdletBinding()]
param(
  [switch]$StopDocker,
  [switch]$Clean
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $repoRoot

$stateDir = Join-Path $env:TEMP "sanad-local"
$apiPidFile = Join-Path $stateDir "api.pid"
$tunnelPidFile = Join-Path $stateDir "tunnel.pid"

function Stop-PidFile([string]$Path, [string]$Label) {
  if (-not (Test-Path $Path)) {
    Write-Host "[demo] $Label PID file not found." -ForegroundColor DarkGray
    return
  }

  $pidText = Get-Content $Path -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($pidText -and $pidText -match "^\d+$") {
    Stop-Process -Id ([int]$pidText) -Force -ErrorAction SilentlyContinue
    Write-Host "[demo] Stopped $Label PID $pidText." -ForegroundColor Cyan
  }
  Remove-Item $Path -Force -ErrorAction SilentlyContinue
}

Stop-PidFile $tunnelPidFile "tunnel"
Stop-PidFile $apiPidFile "API"

if ($StopDocker) {
  Write-Host "[demo] Stopping PostgreSQL and Redis..." -ForegroundColor Cyan
  docker compose stop postgres redis
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "[demo] docker compose stop failed."
  }
}

if ($Clean) {
  Write-Host "[demo] Removing local demo logs and state..." -ForegroundColor Cyan
  Remove-Item $stateDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "[demo] Done." -ForegroundColor Green
