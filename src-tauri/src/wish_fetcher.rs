use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WishHistoryItem {
    pub id: String,
    pub name: String,
    pub rarity: u8,
    #[serde(rename = "itemType")]
    pub item_type: String,
    pub time: String,
    pub banner: String,
}

#[derive(Debug, Deserialize)]
struct ApiResponse {
    retcode: i32,
    message: Option<String>,
    data: Option<ApiData>,
}

#[derive(Debug, Deserialize)]
struct ApiData {
    list: Vec<ApiWishItem>,
}

#[derive(Debug, Deserialize)]
struct ApiWishItem {
    id: String,
    name: String,
    rank_type: String,
    item_type: String,
    time: String,
    gacha_type: String,
}

// Banner type mapping
fn map_gacha_type(gacha_type: &str) -> String {
    match gacha_type {
        "301" => "character".to_string(),
        "302" => "weapon".to_string(),
        "200" => "standard".to_string(),
        "500" => "chronicled".to_string(),
        _ => "unknown".to_string(),
    }
}

/// Extract API endpoint from web URL
fn get_api_endpoint(web_url: &str) -> Result<String, String> {
    let url = reqwest::Url::parse(web_url)
        .map_err(|e| format!("Invalid URL: {}", e))?;

    // Determine region from hostname
    let hostname = url.host_str().ok_or("No hostname in URL")?;

    let api_base = if hostname.contains("hoyoverse.com") {
        // Global server
        "https://hk4e-api-os.hoyoverse.com/event/gacha_info/api/getGachaLog"
    } else if hostname.contains("mihoyo.com") {
        // CN server
        "https://hk4e-api.mihoyo.com/event/gacha_info/api/getGachaLog"
    } else {
        return Err(format!("Unknown hostname: {}", hostname));
    };

    Ok(api_base.to_string())
}

/// Extract query parameters from web URL
fn extract_auth_params(web_url: &str) -> Result<Vec<(String, String)>, String> {
    let url = reqwest::Url::parse(web_url)
        .map_err(|e| format!("Invalid URL: {}", e))?;

    let mut params = Vec::new();
    let hostname = url.host_str().ok_or("No hostname in URL")?;

    // Extract important auth parameters
    for (key, value) in url.query_pairs() {
        match key.as_ref() {
            "authkey" | "authkey_ver" | "sign_type" | "auth_appid" |
            "lang" | "device_type" | "game_biz" | "region" => {
                params.push((key.to_string(), value.to_string()));
            }
            _ => {}
        }
    }

    if !params.iter().any(|(k, _)| k == "authkey") {
        return Err("Missing authkey parameter".to_string());
    }

    // Add game_biz if not present (required by API)
    if !params.iter().any(|(k, _)| k == "game_biz") {
        let game_biz = if hostname.contains("hoyoverse.com") {
            "hk4e_global"
        } else {
            "hk4e_cn"
        };
        params.push(("game_biz".to_string(), game_biz.to_string()));
    }

    Ok(params)
}

/// Fetch wish history for a specific banner type
pub async fn fetch_banner_history(
    base_url: &str,
    gacha_type: &str,
) -> Result<Vec<WishHistoryItem>, String> {
    let mut wishes = Vec::new();
    let mut seen_ids = HashSet::new();
    let mut page = 1;
    let mut end_id = "0".to_string();
    let page_size = 20;

    let client = reqwest::Client::new();

    // Parse the original URL to get the query string
    let original_url = reqwest::Url::parse(base_url)
        .map_err(|e| format!("Invalid URL: {}", e))?;

    // Get the correct API endpoint
    let api_endpoint = get_api_endpoint(base_url)?;

    loop {
        // Start with the API endpoint and add the original query string
        let mut url_string = format!("{}?{}", api_endpoint, original_url.query().unwrap_or(""));

        // Append additional parameters
        url_string.push_str(&format!("&gacha_type={}", gacha_type));
        url_string.push_str(&format!("&page={}", page));
        url_string.push_str(&format!("&size={}", page_size));

        // Only add end_id if it's not "0" (first page doesn't need it)
        if end_id != "0" {
            url_string.push_str(&format!("&end_id={}", end_id));
        }

        // Log the request URL for debugging (first iteration only)
        if page == 1 {
            eprintln!("DEBUG: Fetching from URL: {}", url_string);
        }

        // Make the request with proper headers
        let response = client
            .get(&url_string)
            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
            .header("Accept", "application/json")
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        // Get the status before consuming the response
        let status = response.status();

        if !status.is_success() {
            // Try to get response body for more details
            let body = response.text().await.unwrap_or_else(|_| "Could not read response body".to_string());
            eprintln!("DEBUG: Response body: {}", body);
            return Err(format!("HTTP {}: {} - Body: {}", status, status.canonical_reason().unwrap_or("Unknown"), body));
        }

        let api_response: ApiResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        // Check for API errors
        if api_response.retcode != 0 {
            if api_response.retcode == -101 {
                return Err("Authkey has expired. Please run the script again to get a new URL.".to_string());
            }
            return Err(api_response.message.unwrap_or_else(|| format!("API error: {}", api_response.retcode)));
        }

        let list = api_response
            .data
            .ok_or("No data in response")?
            .list;

        if list.is_empty() {
            break;
        }

        // Filter for items that match the requested banner type and haven't been seen
        let new_items: Vec<_> = list
            .into_iter()
            .filter(|item| {
                !seen_ids.contains(&item.id) && item.gacha_type == gacha_type
            })
            .collect();

        if new_items.is_empty() {
            break;
        }

        // Transform API data to WishHistoryItem
        for item in new_items {
            seen_ids.insert(item.id.clone());
            wishes.push(WishHistoryItem {
                id: item.id.clone(),
                name: item.name,
                rarity: item.rank_type.parse::<u8>().unwrap_or(3),
                item_type: if item.item_type.to_lowercase() == "character" {
                    "character".to_string()
                } else {
                    "weapon".to_string()
                },
                time: item.time,
                banner: map_gacha_type(&item.gacha_type),
            });

            end_id = item.id;
        }

        // If we got fewer items than requested, we've reached the end
        if seen_ids.len() < page_size {
            break;
        }

        page += 1;

        // Rate limiting - wait 500ms between requests
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    }

    Ok(wishes)
}

/// Fetch wish history for all selected banner types
pub async fn fetch_all_wishes(
    url: &str,
    selected_banners: Vec<String>,
) -> Result<Vec<WishHistoryItem>, String> {
    let mut all_wishes = Vec::new();

    let banner_map = vec![
        ("character", "301"),
        ("weapon", "302"),
        ("standard", "200"),
        ("chronicled", "500"),
    ];

    for (banner_name, gacha_type) in banner_map {
        if selected_banners.contains(&banner_name.to_string()) {
            let wishes = fetch_banner_history(url, gacha_type).await?;
            all_wishes.extend(wishes);
        }
    }

    Ok(all_wishes)
}
