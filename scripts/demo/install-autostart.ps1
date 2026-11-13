# Install (or remove) a Windows Startup shortcut for the local SANAD demo.
#
# The shortcut runs scripts/demo/start.ps1 -Watch at user logon, so a reboot
# restarts Docker, the API, and the tunnel without manual steps.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/demo/install-autostart.ps1 `
#     -Tunnel ngrok -NgrokDomain sanad-demo.ngrok.app -StartNow
#
#   powershell -ExecutionPolicy Bypass -File scripts/demo/install-autostart.ps1 -Remove
#
# The ngrok authtoken must be installed once, outside this repo:
#   ngrok config add-authtoken <token>
# Never commit or paste the token.

[CmdletBinding()]
param(
  [ValidateSet("ngrok", "cloudflared")]
  [string]$Tunnel = "ngrok",
  [string]$NgrokDomain = $env:NGROK_DOMAIN,
  [switch]$NoWatch,
  [switch]$Remove,
  [switch]$StartNow
)

$ErrorActionPreference = "Stop"

$startScript = Join-Path $PSScriptRoot "start.ps1"
$startupDir = [Environment]::GetFolderPath("Startup")
$cmdPath = Join-Path $startupDir "SANAD-Demo.cmd"

if ($Remove) {
  if (Test-Path $cmdPath) {
    Remove-Item $cmdPath -Force
    Write-Host "[demo] Removed $cmdPath" -ForegroundColor Cyan
  } else {
    Write-Host "[demo] Startup entry was not installed." -ForegroundColor DarkGray
  }
  return
}

if (-not (Test-Path $startScript)) {
  throw "start.ps1 was not found at $startScript"
}

if ($Tunnel -eq "ngrok" -and -not $NgrokDomain) {
  Write-Warning "[demo] No -NgrokDomain / NGROK_DOMAIN set."
  Write-Warning "[demo] The ngrok URL will change on every restart; claim a free static domain first."
}

if ($Tunnel -eq "cloudflared") {
  Write-Warning "[demo] cloudflared quick tunnels get a new URL on every restart."
  Write-Warning "[demo] Use ngrok with a static domain for an unattended demo."
}

$argument = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$startScript`" -Tunnel $Tunnel"
if ($NgrokDomain) {
  $argument += " -NgrokDomain `"$NgrokDomain`""
}
if (-not $NoWatch) {
  $argument += " -Watch"
}

$content = @"
@echo off
start "" powershell.exe $argument
"@
Set-Content -Path $cmdPath -Value $content -Encoding ASCII

Write-Host "[demo] Installed startup entry:" -ForegroundColor Green
Write-Host "  $cmdPath"
Write-Host "  $argument"
Write-Host ""
Write-Host "The watchdog starts at your next logon." -ForegroundColor Cyan

if ($StartNow) {
  Write-Host "[demo] Starting it now..." -ForegroundColor Cyan
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$cmdPath`"" -WindowStyle Hidden
}
