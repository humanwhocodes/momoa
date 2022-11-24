mod tokens;
mod errors;
mod location;
mod readers;

pub use tokens::{tokenize_json, tokenize_jsonc, TokenKind, Tokens};
pub use location::{Location, LocationRange};
pub use errors::MomoaError;
use wasm_bindgen::JsValue;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
pub fn tokenize_js(input: &str, allow_comments: bool) -> JsValue {
    
    let result = if allow_comments {
        tokenize_json(input).unwrap()
    } else {
        tokenize_json(input).unwrap()
    };
    
    serde_wasm_bindgen::to_value(&result).unwrap()
}
