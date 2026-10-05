# APEX Auto-Launcher — Automatically starts server if needed and opens website
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$url = "http://localhost:5000"

$running = $false
try {
    $r = Invoke-WebRequest -Uri "$url/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    if ($r.StatusCode -eq 200) { $running = $true }
} catch {
    $running = $false
}

if (-not $running) {
    $python = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
    if (-not (Test-Path $python)) { $python = "python" }
    Start-Process -FilePath $python -ArgumentList "run.py" -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
    Start-Sleep -Seconds 2
}

# Open the website in user's default browser
Start-Process $url
