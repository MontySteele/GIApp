use regex::Regex;
use std::fs;
use std::path::PathBuf;

/// Find the Genshin Impact log file path based on the operating system
pub fn find_log_file() -> Result<PathBuf, String> {
    #[cfg(target_os = "windows")]
    {
        let user_profile = std::env::var("USERPROFILE")
            .map_err(|_| "Could not find USERPROFILE environment variable".to_string())?;

        // Check Global version
        let global_path = PathBuf::from(&user_profile)
            .join("AppData")
            .join("LocalLow")
            .join("miHoYo")
            .join("Genshin Impact")
            .join("output_log.txt");

        if global_path.exists() {
            return Ok(global_path);
        }

        // Check CN version
        let cn_path = PathBuf::from(&user_profile)
            .join("AppData")
            .join("LocalLow")
            .join("miHoYo")
            .join("原神")
            .join("output_log.txt");

        if cn_path.exists() {
            return Ok(cn_path);
        }

        Err("Genshin Impact log file not found. Make sure the game is installed and you've opened wish history at least once.".to_string())
    }

    #[cfg(target_os = "macos")]
    {
        let home = dirs::home_dir()
            .ok_or("Could not find home directory".to_string())?;

        let log_path = home
            .join("Library")
            .join("Application Support")
            .join("miHoYo")
            .join("Genshin Impact")
            .join("output_log.txt");

        if log_path.exists() {
            return Ok(log_path);
        }

        Err("Genshin Impact log file not found. Make sure the game is installed and you've opened wish history at least once.".to_string())
    }

    #[cfg(target_os = "linux")]
    {
        let home = dirs::home_dir()
            .ok_or("Could not find home directory".to_string())?;

        let username = std::env::var("USER")
            .unwrap_or_else(|_| "steamuser".to_string());

        // Check Wine prefix
        let wine_path = home
            .join(".wine")
            .join("drive_c")
            .join("users")
            .join(&username)
            .join("AppData")
            .join("LocalLow")
            .join("miHoYo")
            .join("Genshin Impact")
            .join("output_log.txt");

        if wine_path.exists() {
            return Ok(wine_path);
        }

        // Check Steam/Proton prefix
        let steam_path = home
            .join(".local")
            .join("share")
            .join("Steam")
            .join("steamapps")
            .join("compatdata")
            .join("1938010")
            .join("pfx")
            .join("drive_c")
            .join("users")
            .join("steamuser")
            .join("AppData")
            .join("LocalLow")
            .join("miHoYo")
            .join("Genshin Impact")
            .join("output_log.txt");

        if steam_path.exists() {
            return Ok(steam_path);
        }

        Err("Genshin Impact log file not found. Make sure the game is installed and you've opened wish history at least once.".to_string())
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        Err("Unsupported operating system".to_string())
    }
}

/// Extract the wish history URL from the log file
pub fn extract_wish_url(log_path: &PathBuf) -> Result<String, String> {
    let content = fs::read_to_string(log_path)
        .map_err(|e| format!("Failed to read log file: {}", e))?;

    // Regex patterns to match wish history URLs (both /log and /index.html)
    let patterns = vec![
        r"https://gs\.hoyoverse\.com/genshin/event/e20190909gacha-v3/(log|index\.html)\?[^\s""]+",
        r"https://hk4e-api[^\s""]*gacha[^\s""]+",
    ];

    for pattern_str in patterns {
        let regex = Regex::new(pattern_str)
            .map_err(|e| format!("Invalid regex pattern: {}", e))?;

        // Find all matches and get the last (most recent) one
        if let Some(last_match) = regex.find_iter(&content).last() {
            let mut url = last_match.as_str().to_string();

            // Normalize URL: convert /index.html to /log
            url = url.replace("/index.html?", "/log?");

            return Ok(url);
        }
    }

    Err("Could not find wish history URL in log file. Please open the wish history in-game, wait for it to load, then try again.".to_string())
}

/// Auto-detect and extract wish URL from system
pub fn auto_extract_wish_url() -> Result<String, String> {
    let log_path = find_log_file()?;
    extract_wish_url(&log_path)
}
