mod log_parser;
mod wish_fetcher;

use log_parser::{auto_extract_wish_url, find_log_file};
use wish_fetcher::{fetch_all_wishes, WishHistoryItem};

// Tauri commands

/// Auto-extract wish URL from the Genshin Impact log file
#[tauri::command]
async fn extract_wish_url() -> Result<String, String> {
    auto_extract_wish_url()
}

/// Find the Genshin Impact log file path
#[tauri::command]
async fn get_log_file_path() -> Result<String, String> {
    find_log_file().map(|p| p.to_string_lossy().to_string())
}

/// Fetch wish history from HoYoverse API
#[tauri::command]
async fn fetch_wish_history(
    url: String,
    selected_banners: Vec<String>,
) -> Result<Vec<WishHistoryItem>, String> {
    fetch_all_wishes(&url, selected_banners).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
        extract_wish_url,
        get_log_file_path,
        fetch_wish_history,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
