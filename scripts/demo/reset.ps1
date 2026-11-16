# Destructive demo reset for the local Docker database.
#
# Deletes ALL demo data (users, courses, enrollments, orders, payments,
# vouchers, sessions, audit/outbox rows) and re-seeds the known clean state:
#   - tenant sanad-demo + its domains are preserved (the running API's tenant
#     cache keeps a valid tenant id);
#   - 2 demo users, 3 published courses, free-course enrollment;
#   - paid course arabic-3-prep at 199.00 EGP + SANAD-2026 voucher, unenrolled;
#   - 0 orders / payments / voucher redemptions.
#
# A backup is written to the gitignored backups/ folder before anything is
# deleted. Schema migrations are applied as the owner first (safe no-op when
# already at 8/8). Seeds run as the owner; the runtime API uses app_user.
#
# Usage:
#   pnpm demo:reset
#   pnpm demo:reset -- -Force
#   pnpm demo:reset -- -Force -SkipBackup
#
# This briefly disrupts the demo (sessions are invalidated and the tables are
# empty until the seed finishes). Run it before a demo, not during one.

[CmdletBinding()]
param(
  [switch]$Force,
  [switch]$SkipBackup
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $repoRoot

$container = "learning-platform-db"
$dbName = "learning_platform"
$stateDir = Join-Path $env:TEMP "sanad-local"
New-Item -ItemType Directory -Force -Path $stateDir | Out-Null

$running = docker inspect -f "{{.State.Running}}" $container 2>$null
if ($running -ne "true") {
  throw "Container $container is not running. Start the demo database first."
}

if (-not $Force) {
  Write-Warning "[demo] This deletes ALL demo data and re-seeds the clean demo."
  Write-Warning "[demo] Users/courses/enrollments/orders/payments/vouchers will be replaced."
  $answer = Read-Host "Type RESET to continue"
  if ($answer -cne "RESET") {
    Write-Host "[demo] Aborted." -ForegroundColor Yellow
    exit 1
  }
}

if (-not $SkipBackup) {
  Write-Host "[demo] Backing up the current demo database first..." -ForegroundColor Cyan
  & (Join-Path $PSScriptRoot "backup.ps1")
}

# The owner URL is local-only and is used for migrations, truncation and seeds.
# Never use the runtime app_user URL for these steps.
$ownerUrl = "postgresql://postgres:postgres@127.0.0.1:5432/learning_platform?schema=public"
$env:DATABASE_URL = $ownerUrl
$env:MIGRATION_DATABASE_URL = $ownerUrl
$env:PROD_TENANT_DOMAINS = "sanad-edtech.vercel.app,127.0.0.1"

Write-Host "[demo] Applying migrations as the owner..." -ForegroundColor Cyan
pnpm --filter api exec prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
  throw "prisma migrate deploy failed; no demo data was deleted."
}

# Remove known RLS test fixtures if a previous isolation run failed before
# teardown. The demo tenant itself is preserved so its id (and the running
# API's tenant cache) stay valid.
$cleanupSql = @"
DELETE FROM "tenants" WHERE "id" IN ('tenant_rls_a', 'tenant_rls_b');
"@
$cleanupPath = Join-Path $stateDir "reset-cleanup.sql"
$cleanupRemote = "/tmp/sanad-reset-cleanup.sql"
Set-Content -Path $cleanupPath -Value $cleanupSql -Encoding ASCII
try {
  docker cp $cleanupPath "${container}:$cleanupRemote" *> $null
  if ($LASTEXITCODE -ne 0) { throw "docker cp failed for the cleanup SQL." }
  docker exec $container psql -U postgres -d $dbName -v ON_ERROR_STOP=1 -f $cleanupRemote
  if ($LASTEXITCODE -ne 0) { throw "Cleanup SQL failed; no demo data was deleted." }
} finally {
  docker exec $container rm -f $cleanupRemote *> $null
  Remove-Item $cleanupPath -Force -ErrorAction SilentlyContinue
}

# Truncate every public table except the migration history, the demo tenant
# and its domains. CASCADE follows child tables; tenants/tenant_domains are
# deliberately excluded so the tenant id and the pre-auth domain mapping keep
# working for the running API.
$truncateSql = @"
SET client_min_messages TO warning;
DO `$`$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('_prisma_migrations', 'tenants', 'tenant_domains')
    ORDER BY tablename
  LOOP
    EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
  END LOOP;
END
`$`$;
"@
$truncatePath = Join-Path $stateDir "reset-truncate.sql"
$truncateRemote = "/tmp/sanad-reset-truncate.sql"
Set-Content -Path $truncatePath -Value $truncateSql -Encoding ASCII
try {
  Write-Host "[demo] Deleting demo data (preserving tenant and domains)..." -ForegroundColor Cyan
  docker cp $truncatePath "${container}:$truncateRemote" *> $null
  if ($LASTEXITCODE -ne 0) { throw "docker cp failed for the truncate SQL." }
  docker exec $container psql -U postgres -d $dbName -v ON_ERROR_STOP=1 -f $truncateRemote
  if ($LASTEXITCODE -ne 0) { throw "Truncate failed. The backup is in backups/." }
} finally {
  docker exec $container rm -f $truncateRemote *> $null
  Remove-Item $truncatePath -Force -ErrorAction SilentlyContinue
}

Write-Host "[demo] Re-seeding the clean demo..." -ForegroundColor Cyan
pnpm --filter api seed:path2
if ($LASTEXITCODE -ne 0) {
  throw "Base demo seed failed. Restore the backup in backups/ if needed."
}

pnpm --filter api seed:paid-demo
if ($LASTEXITCODE -ne 0) {
  throw "Paid demo seed failed. Restore the backup in backups/ if needed."
}

# Verify the exact demo invariants. Keep this in sync with demo:doctor.
$verifySql = @"
SELECT
  (SELECT count(*) FROM "_prisma_migrations") AS migrations,
  (SELECT count(*) FROM "tenants") AS tenants,
  (SELECT count(*) FROM "users") AS users,
  (SELECT count(*) FROM "courses" WHERE status = 'PUBLISHED') AS published,
  (SELECT count(*) FROM "enrollments") AS enrollments,
  (SELECT count(*) FROM "enrollments" e JOIN "courses" c ON c.id = e."courseId" WHERE c.slug = 'arabic-1-prep') AS free_enrollments,
  (SELECT count(*) FROM "enrollments" e JOIN "courses" c ON c.id = e."courseId" WHERE c.slug = 'arabic-3-prep') AS paid_enrollments,
  (SELECT count(*) FROM "orders") AS orders,
  (SELECT count(*) FROM "payments") AS payments,
  (SELECT count(*) FROM "vouchers") AS vouchers,
  (SELECT count(*) FROM "voucher_redemptions") AS redemptions,
  (SELECT count(*) FROM "videos") AS videos,
  (SELECT count(*) FROM "tenant_domains" WHERE domain = 'sanad-edtech.vercel.app') AS vercel_domain,
  (SELECT count(*) FROM "courses" WHERE slug = 'arabic-3-prep' AND price = 199.00) AS paid_price;
"@
$verifyPath = Join-Path $stateDir "reset-verify.sql"
$verifyRemote = "/tmp/sanad-reset-verify.sql"
Set-Content -Path $verifyPath -Value $verifySql -Encoding ASCII
try {
  docker cp $verifyPath "${container}:$verifyRemote" *> $null
  if ($LASTEXITCODE -ne 0) { throw "docker cp failed for the verify SQL." }
  $raw = docker exec $container psql -U postgres -d $dbName -At -f $verifyRemote
  if ($LASTEXITCODE -ne 0) { throw "Verification SQL failed." }
} finally {
  docker exec $container rm -f $verifyRemote *> $null
  Remove-Item $verifyPath -Force -ErrorAction SilentlyContinue
}

$line = (($raw | Out-String).Trim())
$parts = @($line -split "\|")
$expected = @(
  "8",  # migrations
  "1",  # tenant (sanad-demo preserved)
  "2",  # users
  "3",  # published courses
  "1",  # enrollments
  "1",  # free enrollment
  "0",  # paid enrollment
  "0",  # orders
  "0",  # payments
  "1",  # vouchers
  "0",  # voucher redemptions
  "1",  # videos
  "1",  # Vercel tenant domain
  "1"   # paid course price
)
$labels = @(
  "migrations", "tenants", "users", "published", "enrollments",
  "free_enrollments", "paid_enrollments", "orders", "payments",
  "vouchers", "redemptions", "videos", "vercel_domain", "paid_price"
)

$errors = @()
if ($parts.Count -ne $expected.Count) {
  $errors += "verification returned $($parts.Count) columns, expected $($expected.Count)"
} else {
  for ($i = 0; $i -lt $expected.Count; $i++) {
    if ($parts[$i] -ne $expected[$i]) {
      $errors += "$($labels[$i])=$($parts[$i]) expected $($expected[$i])"
    }
  }
}

if ($errors.Count -gt 0) {
  Write-Host "[demo] Reset verification FAILED:" -ForegroundColor Red
  $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
  Write-Host "[demo] Database was re-seeded but does not match the demo contract." -ForegroundColor Yellow
  Write-Host "[demo] Restore the backup in backups/ or inspect with pnpm demo:doctor." -ForegroundColor Yellow
  exit 1
}

Write-Host "[demo] Destructive reset complete. Demo state verified:" -ForegroundColor Green
Write-Host "  3 published courses, 2 users, 1 free enrollment; paid course unenrolled;" -ForegroundColor Green
Write-Host "  1 voucher, 0 orders/payments/redemptions; 8 migrations." -ForegroundColor Green
Write-Host "[demo] Sessions were invalidated; use the one-click demo login again." -ForegroundColor DarkGray
exit 0
