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

    loop {
        // Parse base URL and add query parameters
        let mut url = reqwest::Url::parse(base_url)
            .map_err(|e| format!("Invalid URL: {}", e))?;

        {
            let mut query_pairs = url.query_pairs_mut();
            query_pairs.append_pair("gacha_type", gacha_type);
            query_pairs.append_pair("page", &page.to_string());
            query_pairs.append_pair("size", &page_size.to_string());
            query_pairs.append_pair("end_id", &end_id);
        }

        // Make the request
        let response = client
            .get(url.as_str())
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("HTTP {}: {}", response.status(), response.status()));
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
