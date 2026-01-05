# Genshin Impact Wish History URL Extractor (Windows PowerShell)
# This script extracts the wish history authentication URL from Genshin Impact's log files

Write-Host "Genshin Impact Wish History URL Extractor" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Find Genshin Impact installation
$logPath = "$env:USERPROFILE\AppData\LocalLow\miHoYo\Genshin Impact\output_log.txt"
$cnLogPath = "$env:USERPROFILE\AppData\LocalLow\miHoYo\原神\output_log.txt"

# Check which log file exists
if (Test-Path $logPath) {
    $targetLog = $logPath
    Write-Host "Found Global version log file" -ForegroundColor Green
} elseif (Test-Path $cnLogPath) {
    $targetLog = $cnLogPath
    Write-Host "Found CN version log file" -ForegroundColor Green
} else {
    Write-Host "Error: Genshin Impact log file not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please make sure:" -ForegroundColor Yellow
    Write-Host "1. Genshin Impact is installed"
    Write-Host "2. You have opened the wish history in-game at least once"
    Write-Host "3. The game is running or was recently run"
    Write-Host ""
    Write-Host "Expected location: $logPath"
    pause
    exit 1
}

Write-Host "Searching for wish history URL..." -ForegroundColor Yellow
Write-Host ""

# Read log file and find wish history URL
try {
    $content = Get-Content -Path $targetLog -Raw

    # Search for wish history URL patterns
    $patterns = @(
        'https://gs\.hoyoverse\.com/genshin/event/e20190909gacha-v3/log\?[^\s"]+',
        'https://hk4e-api[^\s"]*gacha[^\s"]+'
    )

    $url = $null
    foreach ($pattern in $patterns) {
        $matches = [regex]::Matches($content, $pattern)
        if ($matches.Count -gt 0) {
            # Get the last (most recent) match
            $url = $matches[$matches.Count - 1].Value
            break
        }
    }

    if (-not $url) {
        Write-Host "Error: Could not find wish history URL in log file" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please try the following:" -ForegroundColor Yellow
        Write-Host "1. Open Genshin Impact"
        Write-Host "2. Go to the Wish menu"
        Write-Host "3. Click on 'History' at the bottom"
        Write-Host "4. Wait for the history page to load"
        Write-Host "5. Close the game and run this script again"
        Write-Host ""
        Write-Host "Note: The URL expires after a few hours, so use it soon after extracting."
        pause
        exit 1
    }

    # Display success message and URL
    Write-Host "✓ Wish history URL found!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Copy the URL below and paste it into the app:" -ForegroundColor Cyan
    Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Gray
    Write-Host $url -ForegroundColor White
    Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Important notes:" -ForegroundColor Yellow
    Write-Host "• This URL contains your authentication token"
    Write-Host "• It will expire in a few hours"
    Write-Host "• Keep it private and don't share it with others"
    Write-Host "• Paste it into the Genshin Progress Tracker import page"
    Write-Host ""

    # Optionally copy to clipboard
    $copyChoice = Read-Host "Copy to clipboard? (Y/N)"
    if ($copyChoice -eq "Y" -or $copyChoice -eq "y") {
        Set-Clipboard -Value $url
        Write-Host "✓ Copied to clipboard!" -ForegroundColor Green
    }

} catch {
    Write-Host "Error reading log file: $_" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
pause
