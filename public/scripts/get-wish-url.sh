#!/bin/bash

# Genshin Impact Wish History URL Extractor (macOS/Linux)
# This script extracts the wish history authentication URL from Genshin Impact's log files

echo "Genshin Impact Wish History URL Extractor"
echo "=========================================="
echo ""

# Detect OS and set log file paths
OS_TYPE=$(uname -s)

if [[ "$OS_TYPE" == "Darwin" ]]; then
    # macOS
    LOG_FILE="$HOME/Library/Application Support/miHoYo/Genshin Impact/output_log.txt"
    CACHE_FILE="$HOME/Library/Caches/miHoYo/Genshin Impact/Cache/Cache_Data/data_2"
elif [[ "$OS_TYPE" == "Linux" ]]; then
    # Linux (Wine/Proton)
    LOG_FILE="$HOME/.wine/drive_c/users/$USER/AppData/LocalLow/miHoYo/Genshin Impact/output_log.txt"
    # Alternative for Steam/Proton
    if [ ! -f "$LOG_FILE" ]; then
        LOG_FILE="$HOME/.local/share/Steam/steamapps/compatdata/1938010/pfx/drive_c/users/steamuser/AppData/LocalLow/miHoYo/Genshin Impact/output_log.txt"
    fi
else
    echo "Error: Unsupported operating system: $OS_TYPE"
    echo "This script only works on macOS and Linux."
    exit 1
fi

# Check if log file exists
if [ ! -f "$LOG_FILE" ]; then
    echo "Error: Genshin Impact log file not found at:"
    echo "$LOG_FILE"
    echo ""
    echo "Please make sure:"
    echo "1. Genshin Impact is installed"
    echo "2. You have opened the wish history in-game at least once"
    echo "3. The game is running or was recently run"
    exit 1
fi

echo "Found log file: $LOG_FILE"
echo "Searching for wish history URL..."
echo ""

# Extract the wish history URL from the log (including both /log and /index.html)
# The URL contains the authentication token and is used by the game to fetch wish history
URL=$(grep -oE "https://gs.hoyoverse.com/genshin/event/e20190909gacha-v3/(log|index\.html)\?[^\"]*" "$LOG_FILE" | tail -n 1)

# Alternative: Search for URLs from other regions
if [ -z "$URL" ]; then
    URL=$(grep -o "https://hk4e-api[^\"]*gacha[^\"]*" "$LOG_FILE" | tail -n 1)
fi

# Normalize URL: convert /index.html to /log if present
URL=$(echo "$URL" | sed 's|/index\.html?|/log?|')

if [ -z "$URL" ]; then
    echo "Error: Could not find wish history URL in log file."
    echo ""
    echo "Please try the following:"
    echo "1. Open Genshin Impact"
    echo "2. Go to the Wish menu"
    echo "3. Click on 'History' at the bottom"
    echo "4. Wait for the history page to load"
    echo "5. Close the game and run this script again"
    echo ""
    echo "Note: The URL expires after a few hours, so use it soon after extracting."
    exit 1
fi

# Display the URL
echo "✓ Wish history URL found!"
echo ""
echo "Copy the URL below and paste it into the app:"
echo "─────────────────────────────────────────────────────────────────"
echo "$URL"
echo "─────────────────────────────────────────────────────────────────"
echo ""
echo "Important notes:"
echo "• This URL contains your authentication token"
echo "• It will expire in a few hours"
echo "• Keep it private and don't share it with others"
echo "• Paste it into the Genshin Progress Tracker import page"
echo ""
