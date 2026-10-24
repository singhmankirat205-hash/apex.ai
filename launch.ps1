# APEX Auto-Launcher — Automatically starts server if needed and opens website
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$url = "http://localhost:5000"

$running = $false
try {
    $r = Invoke-WebRequest -Uri "$url/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    if ($r.StatusCode -eq 200) {
        $r_tts = Invoke-WebRequest -Uri "$url/api/tts" -Method Post -Body '{"text":"ping","voice":"aura"}' -ContentType 'application/json' -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        if ($r_tts.StatusCode -eq 200) {
            $running = $true
        }
    }
} catch {
    $running = $false
}

if (-not $running) {
    # Clean up any stale process on port 5000
    Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Milliseconds 500

    $python = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
    if (-not (Test-Path $python)) { $python = "python" }
    Start-Process -FilePath $python -ArgumentList "run.py" -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
    Start-Sleep -Seconds 3
}

# Open the website in user's default browser
Start-Process $url
