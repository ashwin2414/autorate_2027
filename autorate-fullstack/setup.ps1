# One-time setup. Run from this folder (the one containing backend and frontend):
#   powershell -ExecutionPolicy Bypass -File .\setup.ps1
$root = $PSScriptRoot

if (-not (Test-Path "$root\backend\.env")) {
  Copy-Item "$root\backend\.env.example" "$root\backend\.env"
  $secret = [guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
  (Get-Content "$root\backend\.env") -replace "change-this-to-a-long-random-string", $secret | Set-Content "$root\backend\.env"
  Write-Host "Created backend\.env" -ForegroundColor Green
}

Push-Location "$root\backend";  npm install; Pop-Location
Push-Location "$root\frontend"; npm install; Pop-Location

Write-Host "`nLoading cars, reviews and the admin account into MongoDB (needs internet for car photos)..." -ForegroundColor Cyan
Push-Location "$root\backend"; npm run seed; Pop-Location
Write-Host "`nSetup finished. Now run:  powershell -ExecutionPolicy Bypass -File .\start.ps1" -ForegroundColor Green
