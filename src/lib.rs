mod tokens;
mod errors;
mod location;

pub use tokens::{tokenize, TokenKind, Tokens};
pub use location::{Location, LocationRange};
pub use errors::MomoaError;
use wasm_bindgen::JsValue;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
pub fn tokenize_js(input: &str) -> JsValue {
    let result = tokenize(input).unwrap();
    serde_wasm_bindgen::to_value(&result).unwrap()
}
