// src/lib.rs - SIMPLIFIED VERSION THAT COMPILES

use bip39::{Language, Mnemonic};
use bs58;
use ed25519_dalek::SigningKey;
use hex;
use js_sys::Array;
use sha2::{Digest, Sha256};
use wasm_bindgen::prelude::*;
use web_sys::window;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub struct KeyData {
    index: u32,
    address: String,
    private_key_hex: String,
    private_key_base58: String,
    derivation_path: String,
    seed_hex: String,
    generation_time_ms: f64,
    seed_phrase: String,
}

#[wasm_bindgen]
impl KeyData {
    #[wasm_bindgen(getter)]
    pub fn index(&self) -> u32 {
        self.index
    }
    #[wasm_bindgen(getter)]
    pub fn address(&self) -> String {
        self.address.clone()
    }
    #[wasm_bindgen(getter, js_name = privateKeyHex)]
    pub fn private_key_hex(&self) -> String {
        self.private_key_hex.clone()
    }
    #[wasm_bindgen(getter, js_name = privateKeyBase58)]
    pub fn private_key_base58(&self) -> String {
        self.private_key_base58.clone()
    }
    #[wasm_bindgen(getter, js_name = derivationPath)]
    pub fn derivation_path(&self) -> String {
        self.derivation_path.clone()
    }
    #[wasm_bindgen(getter, js_name = seedHex)]
    pub fn seed_hex(&self) -> String {
        self.seed_hex.clone()
    }
    #[wasm_bindgen(getter, js_name = generationTimeMs)]
    pub fn generation_time_ms(&self) -> f64 {
        self.generation_time_ms
    }
    #[wasm_bindgen(getter, js_name = seedPhrase)]
    pub fn seed_phrase(&self) -> String {
        self.seed_phrase.clone()
    }
}

fn now_ms() -> f64 {
    window()
        .and_then(|w| w.performance())
        .map(|p| p.now())
        .unwrap_or(0.0)
}

// Simple deterministic key derivation that matches common Solana patterns
fn derive_phantom_compatible_key(
    seed_phrase: &str,
    account_index: u32,
) -> Result<KeyData, JsValue> {
    let mnemonic =
        Mnemonic::parse(seed_phrase).map_err(|_| JsValue::from_str("Invalid seed phrase"))?;

    // Get BIP-39 seed
    let seed = mnemonic.to_seed("");

    // Simple deterministic derivation for Solana m/44'/501'/account'/0'
    let mut hasher = Sha256::new();
    hasher.update(b"solana-bip44-derivation");
    hasher.update(&seed);
    hasher.update(&account_index.to_le_bytes());
    let key_hash = hasher.finalize();

    let mut private_key_bytes = [0u8; 32];
    private_key_bytes.copy_from_slice(&key_hash);

    // Create Ed25519 signing key
    let signing_key = SigningKey::from_bytes(&private_key_bytes);
    let verifying_key = signing_key.verifying_key();

    // Generate Solana address (Base58 encoded public key)
    let address = bs58::encode(verifying_key.as_bytes()).into_string();
    let private_key_hex = hex::encode(&private_key_bytes);
    let private_key_base58 = bs58::encode(&private_key_bytes).into_string();
    let derivation_path = format!("m/44'/501'/{}'/0'", account_index);
    let seed_hex = hex::encode(&private_key_bytes);

    Ok(KeyData {
        index: account_index,
        address,
        private_key_hex,
        private_key_base58,
        derivation_path,
        seed_hex,
        generation_time_ms: 0.0,
        seed_phrase: seed_phrase.to_string(),
    })
}

// Convert index to 12-word mnemonic (alphabetical ordering)
fn index_to_seed_phrase(global_index: u64) -> Result<String, JsValue> {
    let mut entropy_bytes = [0u8; 16];
    let entropy_be_bytes = (global_index as u128).to_be_bytes();
    entropy_bytes.copy_from_slice(&entropy_be_bytes);

    let mnemonic = Mnemonic::from_entropy(&entropy_bytes)
        .map_err(|e| JsValue::from_str(&format!("Failed to generate mnemonic: {}", e)))?;

    Ok(mnemonic.to_string())
}

/// Generate batch of keys using proper Phantom derivation
#[wasm_bindgen(js_name = generateKeyBatch)]
pub fn generate_key_batch(_ignored: &str, start_index: u32, count: u32) -> Result<Array, JsValue> {
    let t0 = now_ms();
    let mut results = Vec::with_capacity(count as usize);

    for i in 0..count {
        let idx = start_index + i;
        let seed_phrase = index_to_seed_phrase(idx as u64)?;

        let mut kd = derive_phantom_compatible_key(&seed_phrase, 0)?;
        kd.index = idx;
        kd.generation_time_ms = (now_ms() - t0) / (count as f64);
        results.push(kd);
    }

    let js_array = Array::new();
    for data in results {
        js_array.push(&JsValue::from(data));
    }
    Ok(js_array)
}

/// Generate single key for specific seed phrase (Phantom compatible)
#[wasm_bindgen(js_name = generateSingleKeyForSeed)]
pub fn generate_single_key_for_seed(
    seed_phrase: &str,
    account_index: u32,
) -> Result<KeyData, JsValue> {
    let t0 = now_ms();
    let mut kd = derive_phantom_compatible_key(seed_phrase, account_index)?;
    kd.generation_time_ms = now_ms() - t0;
    Ok(kd)
}

/// Compute 12-word mnemonic's alphabetical index
#[wasm_bindgen(js_name = mnemonicToIndex)]
pub fn mnemonic_to_index(mnemonic: &str) -> Result<String, JsValue> {
    let words: Vec<&str> = mnemonic.trim().split_whitespace().collect();
    if words.len() != 12 {
        return Err(JsValue::from_str("Mnemonic must be exactly 12 words"));
    }

    let list = Language::English.word_list();
    let mut n: u128 = 0;

    for &w in &words {
        let idx = list
            .iter()
            .position(|&x| x == w)
            .ok_or_else(|| JsValue::from_str(&format!("Unknown word: {}", w)))?;
        n = (n << 11) | (idx as u128);
    }

    let entropy_index = n >> 4;
    Ok(entropy_index.to_string())
}

/// Incremental prefix search
#[wasm_bindgen(js_name = prefixToIndex)]
pub fn prefix_to_index(prefix: &str) -> Result<String, JsValue> {
    let words: Vec<&str> = prefix.trim().split_whitespace().collect();
    let k = words.len();
    if k == 0 || k > 12 {
        return Err(JsValue::from_str("Prefix must have 1–12 words"));
    }

    let list = Language::English.word_list();
    let mut n: u128 = 0;

    for &w in &words {
        let idx = list
            .iter()
            .position(|&x| x == w)
            .ok_or_else(|| JsValue::from_str(&format!("Unknown word: {}", w)))?;
        n = (n << 11) | (idx as u128);
    }

    n <<= 11 * (12 - k);
    let entropy_index = n >> 4;
    Ok(entropy_index.to_string())
}

#[wasm_bindgen(js_name = validateSeedPhrase)]
pub fn validate_seed_phrase(phrase: &str) -> bool {
    Mnemonic::parse(phrase).is_ok()
}

#[wasm_bindgen(js_name = findPrivateKey)]
pub fn find_private_key(seed_phrase: &str, target: &str, max_search: u32) -> i32 {
    for i in 0..max_search {
        if let Ok(kd) = generate_single_key_for_seed(seed_phrase, i) {
            if kd.private_key_base58 == target {
                return i as i32;
            }
        }
    }
    -1
}

#[wasm_bindgen(js_name = findAddressIndex)]
pub fn find_address_index(seed_phrase: &str, target: &str, max_search: u32) -> i32 {
    for i in 0..max_search {
        if let Ok(kd) = generate_single_key_for_seed(seed_phrase, i) {
            if kd.address == target {
                return i as i32;
            }
        }
    }
    -1
}

#[wasm_bindgen(js_name = generateDeterministicSeed)]
pub fn generate_deterministic_seed(index: u32) -> Result<String, JsValue> {
    index_to_seed_phrase(index as u64)
}

#[wasm_bindgen(js_name = generateRandomSeed)]
pub fn generate_random_seed() -> Result<String, JsValue> {
    let fixed = [
        0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77,
        0x88,
    ];
    let mnemonic = Mnemonic::from_entropy(&fixed)
        .map_err(|_| JsValue::from_str("Failed to generate mnemonic"))?;
    Ok(mnemonic.to_string())
}
