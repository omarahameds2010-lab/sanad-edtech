# Canonical web dev server: always :3001, always pointed at API :3002.
$env:PORT = "3001"
$env:NEXT_PUBLIC_API_URL = "http://localhost:3002"
Set-Location (Join-Path $PSScriptRoot "..\apps\web")
pnpm dev
