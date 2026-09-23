use rand::Rng;
use serde_json::{json, Value};

/// Overseas (HoYoLAB) dynamic-secret salt, shared by all game-record endpoints.
const DS_SALT: &str = "6s25p5ox5y14umn1p61aqyyvbvvl3lrt";
const RECORD_API_BASE: &str = "https://sg-public-api.hoyolab.com/event/game_record/genshin/api";
/// character/detail rejects oversized id lists; fetch in conservative chunks.
const DETAIL_CHUNK_SIZE: usize = 20;

/// Generate the DS header required by HoYoLAB game-record endpoints:
/// `{t},{r},{md5("salt=<salt>&t=<t>&r=<r>")}`
fn generate_ds() -> String {
    let t = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let mut rng = rand::thread_rng();
    let r: String = (0..6)
        .map(|_| {
            let chars = b"abcdefghijklmnopqrstuvwxyz0123456789";
            chars[rng.gen_range(0..chars.len())] as char
        })
        .collect();
    let hash = format!("{:x}", md5::compute(format!("salt={}&t={}&r={}", DS_SALT, t, r)));
    format!("{},{},{}", t, r, hash)
}

fn friendly_api_error(retcode: i64, message: &str) -> String {
    match retcode {
        -100 | -101 | 10001 => {
            "HoYoLAB rejected the cookie. Copy fresh ltuid_v2 and ltoken_v2 values from hoyolab.com and try again.".to_string()
        }
        10102 => {
            "Battle Chronicle data is not public for this UID. Open HoYoLAB > Battle Chronicle once while signed in, and enable \"Do you agree to share your data\" in its privacy settings.".to_string()
        }
        10104 => {
            "This UID is not linked to the HoYoLAB account the cookie belongs to. Check the UID and cookie match the same account.".to_string()
        }
        1034 | 5003 => {
            "HoYoLAB flagged this request for a captcha check. Open hoyolab.com, view your Battle Chronicle once, then retry.".to_string()
        }
        _ => format!("HoYoLAB API error {}: {}", retcode, message),
    }
}

async fn post_record_api(
    client: &reqwest::Client,
    cookie: &str,
    path: &str,
    body: Value,
) -> Result<Value, String> {
    let url = format!("{}/{}", RECORD_API_BASE, path);

    let response = client
        .post(&url)
        .header("Cookie", cookie)
        .header("DS", generate_ds())
        .header("x-rpc-app_version", "1.5.0")
        .header("x-rpc-client_type", "5")
        .header("x-rpc-language", "en-us")
        .header("x-rpc-lang", "en-us")
        .header("Referer", "https://act.hoyolab.com/")
        .header("Origin", "https://act.hoyolab.com")
        .header("Accept", "application/json")
        .header(
            "User-Agent",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        )
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request to HoYoLAB failed: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        return Err(format!("HoYoLAB returned HTTP {}", status));
    }

    let payload: Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse HoYoLAB response: {}", e))?;

    let retcode = payload["retcode"].as_i64().unwrap_or(-1);
    if retcode != 0 {
        let message = payload["message"].as_str().unwrap_or("unknown error");
        return Err(friendly_api_error(retcode, message));
    }

    payload
        .get("data")
        .cloned()
        .ok_or_else(|| "No data in HoYoLAB response".to_string())
}

/// Fetch the full character roster with equipped gear from the HoYoLAB
/// Battle Chronicle. Returns `{ "list": [...detail entries...], "property_map": {...} }`
/// for the frontend mapper to transform.
pub async fn fetch_characters(uid: &str, server: &str, cookie: &str) -> Result<Value, String> {
    let client = reqwest::Client::new();

    let list_data = post_record_api(
        &client,
        cookie,
        "character/list",
        json!({ "role_id": uid, "server": server }),
    )
    .await?;

    let character_ids: Vec<i64> = list_data["list"]
        .as_array()
        .map(|list| {
            list.iter()
                .filter_map(|c| c["id"].as_i64())
                .collect()
        })
        .unwrap_or_default();

    if character_ids.is_empty() {
        return Err("No characters found in the Battle Chronicle for this UID.".to_string());
    }

    let mut detail_entries: Vec<Value> = Vec::new();
    let mut property_map = Value::Null;

    for chunk in character_ids.chunks(DETAIL_CHUNK_SIZE) {
        let detail_data = post_record_api(
            &client,
            cookie,
            "character/detail",
            json!({ "role_id": uid, "server": server, "character_ids": chunk }),
        )
        .await?;

        if let Some(entries) = detail_data["list"].as_array() {
            detail_entries.extend(entries.iter().cloned());
        }
        if property_map.is_null() {
            if let Some(map) = detail_data.get("property_map") {
                property_map = map.clone();
            }
        }

        // Light rate limiting between chunks
        tokio::time::sleep(tokio::time::Duration::from_millis(300)).await;
    }

    Ok(json!({ "list": detail_entries, "property_map": property_map }))
}
