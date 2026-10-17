# Canonical ports lock: web :3001, API :3002.
# Lists (default) or kills (-Kill) stray listeners on dev ports.
# Never kills anything else. Run from repo root.
param([switch]$Kill)

$ports = @(3000, 3001, 3002)
$found = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $ports -contains $_.LocalPort } |
  Select-Object LocalPort, OwningProcess -Unique

if (-not $found) {
  Write-Host "OK: no listeners on ports 3000/3001/3002."
  exit 0
}

$found | Format-Table -AutoSize

if ($Kill) {
  foreach ($row in $found) {
    if ($row.LocalPort -eq 3002) {
      Write-Host "SKIP: port 3002 (API) — stop it explicitly if needed."
      continue
    }
    Write-Host ("Killing PID {0} on port {1}..." -f $row.OwningProcess, $row.LocalPort)
    Stop-Process -Id $row.OwningProcess -Force -ErrorAction Continue
  }
}
