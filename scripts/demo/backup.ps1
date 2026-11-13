# Back up the local demo database to a gitignored custom-format dump.
#
# Usage:
#   pnpm demo:backup
#   pnpm demo:backup -- -OutputDir C:\path\to\backups
#
# The dump contains demo data. Keep it local; do not commit it.

[CmdletBinding()]
param(
  [string]$OutputDir
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $repoRoot

if (-not $OutputDir) {
  $OutputDir = Join-Path $repoRoot "backups"
}
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$container = "learning-platform-db"
$dbName = "learning_platform"
$dbUser = "postgres"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$target = Join-Path $OutputDir "sanad-demo-$stamp.dump"
$tempPath = "/tmp/sanad-demo-$stamp.dump"

$running = docker inspect -f "{{.State.Running}}" $container 2>$null
if ($running -ne "true") {
  throw "Container $container is not running. Start the demo first."
}

Write-Host "[demo] Creating database dump..." -ForegroundColor Cyan
docker exec $container pg_dump -U $dbUser -d $dbName -Fc -f $tempPath
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed." }

docker cp "${container}:$tempPath" $target
if ($LASTEXITCODE -ne 0) { throw "docker cp failed." }

docker exec $container rm -f $tempPath *> $null

$size = (Get-Item $target).Length
Write-Host "[demo] Backup written: $target" -ForegroundColor Green
Write-Host "[demo] Size: $([math]::Round($size / 1MB, 2)) MB" -ForegroundColor Green
Write-Host "[demo] This file is gitignored. Keep it local." -ForegroundColor DarkGray
