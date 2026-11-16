# Idempotent demo seed/backfill for the local Docker database.
#
# This is the old `demo:reset` behaviour: it ensures the demo tenant, users,
# courses, lessons, exam, assignment, free enrollment, entitlements, domains,
# and (with -Paid) the paid course + voucher. It never deletes data.
#
# Usage:
#   pnpm demo:seed
#   pnpm demo:seed -- -Paid
#
# For a destructive reset, use `pnpm demo:reset` instead.

[CmdletBinding()]
param(
  [switch]$Paid
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $repoRoot

$container = "learning-platform-db"
$running = docker inspect -f "{{.State.Running}}" $container 2>$null
if ($running -ne "true") {
  throw "Container $container is not running. Start the demo database first."
}

# Seeds must run as the table owner/superuser so FORCE RLS cannot hide rows.
# The runtime API uses app_user separately.
$ownerUrl = "postgresql://postgres:postgres@127.0.0.1:5432/learning_platform?schema=public"
$env:DATABASE_URL = $ownerUrl
$env:MIGRATION_DATABASE_URL = $ownerUrl
if (-not $env:PROD_TENANT_DOMAINS) {
  $env:PROD_TENANT_DOMAINS = "sanad-edtech.vercel.app,127.0.0.1"
}

Write-Host "[demo] Seeding the base demo data..." -ForegroundColor Cyan
pnpm --filter api seed:path2
if ($LASTEXITCODE -ne 0) {
  throw "Base demo seed failed."
}

if ($Paid) {
  Write-Host "[demo] Seeding the paid checkout data..." -ForegroundColor Cyan
  pnpm --filter api seed:paid-demo
  if ($LASTEXITCODE -ne 0) {
    throw "Paid demo seed failed."
  }
}

Write-Host "[demo] Demo seed is ready." -ForegroundColor Green
