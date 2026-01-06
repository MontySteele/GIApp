use serde::{Deserialize, Deserializer, Serialize};
use std::collections::HashSet;

/// Deserialize a value that could be either a string or a number into a String
fn string_or_number<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: Deserializer<'de>,
{
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum StringOrNumber {
        String(String),
        Number(i64),
    }

    match StringOrNumber::deserialize(deserializer)? {
        StringOrNumber::String(s) => Ok(s),
        StringOrNumber::Number(n) => Ok(n.to_string()),
    }
}

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
    #[serde(deserialize_with = "string_or_number")]
    rank_type: String,
    item_type: String,
    time: String,
    #[serde(deserialize_with = "string_or_number")]
    gacha_type: String,
}

// Banner type mapping
fn map_gacha_type(gacha_type: &str) -> String {
    match gacha_type {
        "301" => "character".to_string(),
        "400" => "character".to_string(), // Character Event Wish-2
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

    // Use the correct public-operation endpoints (not hk4e-api)
    let api_base = if hostname.contains("webstatic-sea")
        || hostname.contains("hk4e-api-os")
        || hostname.contains("hoyoverse.com") {
        // Global/SEA server
        "https://public-operation-hk4e-sg.hoyoverse.com/gacha_info/api/getGachaLog"
    } else if hostname.contains("mihoyo.com") {
        // CN server
        "https://public-operation-hk4e.mihoyo.com/gacha_info/api/getGachaLog"
    } else {
        return Err(format!("Unknown hostname: {}", hostname));
    };

    Ok(api_base.to_string())
}

/// Extract query parameters from web URL
fn extract_auth_params(web_url: &str) -> Result<Vec<(String, String)>, String> {
    // Note: reqwest::Url::parse automatically decodes query parameters
    // So we get the decoded values from url.query_pairs()
    let url = reqwest::Url::parse(web_url)
        .map_err(|e| format!("Invalid URL: {}", e))?;

    let mut params = Vec::new();
    let hostname = url.host_str().ok_or("No hostname in URL")?;

    // Extract important auth parameters
    // The values from query_pairs() are already decoded by reqwest::Url
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
        let game_biz = if hostname.contains("webstatic-sea")
            || hostname.contains("hk4e-api-os")
            || hostname.contains("hoyoverse.com") {
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

    // Parse the original URL to extract only auth parameters
    let original_url = reqwest::Url::parse(base_url)
        .map_err(|e| format!("Invalid URL: {}", e))?;

    // Get the correct API endpoint
    let api_endpoint = get_api_endpoint(base_url)?;

    // Extract only the necessary auth parameters (not web UI params like win_mode, gacha_id, etc.)
    let hostname = original_url.host_str().ok_or("No hostname in URL")?;
    let mut auth_params = Vec::new();

    for (key, value) in original_url.query_pairs() {
        match key.as_ref() {
            "authkey" | "authkey_ver" | "sign_type" | "auth_appid" |
            "lang" | "device_type" | "game_biz" | "region" => {
                auth_params.push((key.to_string(), value.to_string()));
            }
            _ => {}
        }
    }

    // Ensure game_biz is present
    if !auth_params.iter().any(|(k, _)| k == "game_biz") {
        let game_biz = if hostname.contains("hoyoverse.com") {
            "hk4e_global"
        } else {
            "hk4e_cn"
        };
        auth_params.push(("game_biz".to_string(), game_biz.to_string()));
    }

    loop {
        // Build URL with only necessary parameters
        let mut url = reqwest::Url::parse(&api_endpoint)
            .map_err(|e| format!("Invalid API endpoint: {}", e))?;

        {
            let mut query = url.query_pairs_mut();

            // Add auth parameters
            for (key, value) in &auth_params {
                query.append_pair(key, value);
            }

            // Add API request parameters
            query.append_pair("gacha_type", gacha_type);
            query.append_pair("page", &page.to_string());
            query.append_pair("size", &page_size.to_string());

            // Only add end_id if it's not "0"
            if end_id != "0" {
                query.append_pair("end_id", &end_id);
            }
        }

        let url_string = url.to_string();

        // Log the request URL for debugging (first iteration only)
        if page == 1 {
            eprintln!("DEBUG: Fetching from URL: {}", url_string);
        }

        // Make the request (no custom headers needed)
        let response = client
            .get(&url_string)
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

        eprintln!("DEBUG: Page {} returned {} items for gacha_type={}", page, list.len(), gacha_type);

        if list.is_empty() {
            eprintln!("DEBUG: Empty list, breaking");
            break;
        }

        // Log the first item's gacha_type for debugging
        if let Some(first) = list.first() {
            eprintln!("DEBUG: First item gacha_type='{}' (expected='{}')", first.gacha_type, gacha_type);
        }

        // Filter for items that match the requested banner type and haven't been seen
        let new_items: Vec<_> = list
            .into_iter()
            .filter(|item| {
                let dominated = !seen_ids.contains(&item.id) && item.gacha_type == gacha_type;
                if !dominated {
                    eprintln!("DEBUG: Filtered out item id={} gacha_type={}", item.id, item.gacha_type);
                }
                dominated
            })
            .collect();

        eprintln!("DEBUG: After filtering: {} new items", new_items.len());

        if new_items.is_empty() {
            eprintln!("DEBUG: No new items after filtering, breaking");
            break;
        }

        // Track how many new items we got in this page
        let new_items_count = new_items.len();

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
        if new_items_count < page_size {
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

    eprintln!("DEBUG fetch_all_wishes: selected_banners = {:?}", selected_banners);

    let banner_map: Vec<(&str, Vec<&str>)> = vec![
        ("character", vec!["301", "400"]), // Character Event Wish-1 & Wish-2
        ("weapon", vec!["302"]),
        ("standard", vec!["200"]),
        ("chronicled", vec!["500"]),
    ];

    for (banner_name, gacha_types) in banner_map {
        let should_fetch = selected_banners.contains(&banner_name.to_string());
        eprintln!("DEBUG: banner_name={}, should_fetch={}", banner_name, should_fetch);

        if should_fetch {
            for gacha_type in gacha_types {
                eprintln!("DEBUG: Fetching gacha_type={}", gacha_type);
                let wishes = fetch_banner_history(url, gacha_type).await?;
                eprintln!("DEBUG: Got {} wishes for gacha_type={}", wishes.len(), gacha_type);
                all_wishes.extend(wishes);
            }
        }
    }

    eprintln!("DEBUG: Total wishes fetched = {}", all_wishes.len());
    Ok(all_wishes)
}
