# Seed the paid demo course and voucher into the local Docker database.
#
# Usage:
#   pnpm demo:paid
#   pnpm demo:paid -- -Price 249.00 -VoucherCode SANAD-2026
#
# This is separate from demo:reset on purpose: the judge path keeps the free
# course available, while this script makes the paid checkout reachable.
# It never prints account passwords.

[CmdletBinding()]
param(
  [string]$CourseSlug = "arabic-3-prep",
  [string]$Price = "199.00",
  [string]$VoucherCode = "SANAD-2026"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $repoRoot

$container = "learning-platform-db"
$running = docker inspect -f "{{.State.Running}}" $container 2>$null
if ($running -ne "true") {
  throw "Container $container is not running. Start the demo database first."
}

$env:DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5432/learning_platform?schema=public"
$env:MIGRATION_DATABASE_URL = $env:DATABASE_URL
$env:DEMO_PAID_COURSE_SLUG = $CourseSlug
$env:DEMO_PAID_COURSE_PRICE = $Price
$env:DEMO_VOUCHER_CODE = $VoucherCode

Write-Host "[demo] Seeding paid checkout data..." -ForegroundColor Cyan
pnpm --filter api seed:paid-demo
if ($LASTEXITCODE -ne 0) {
  throw "Paid demo seed failed."
}

Write-Host "[demo] Paid checkout data is ready." -ForegroundColor Green
Write-Host "[demo] Voucher code: $VoucherCode (demo access code, not a password)" -ForegroundColor DarkGray
