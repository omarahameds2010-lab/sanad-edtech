# Canonical API dev server: always :3002.
$env:PORT = "3002"
Set-Location (Join-Path $PSScriptRoot "..\apps\api")
pnpm run dev
