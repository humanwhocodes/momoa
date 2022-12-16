mod tokens;
mod errors;
mod location;
mod readers;
mod parse;
mod mode;
pub mod ast;

pub use mode::Mode;
pub use tokens::{Token, TokenKind};
pub use location::{Location, LocationRange};
pub use errors::MomoaError;
use wasm_bindgen::JsValue;
use wasm_bindgen::prelude::wasm_bindgen;

pub mod json {
    use crate::*;

    pub fn tokenize(text: &str) -> Result<Vec<Token>, MomoaError> {
        tokens::tokenize(text, Mode::Json)
    }

    pub fn parse(text: &str) -> Result<ast::Node, MomoaError> {
        parse::parse(text, Mode::Json)
    }
}

pub mod jsonc {
    use crate::*;

    pub fn tokenize(text: &str) -> Result<Vec<Token>, MomoaError> {
        tokens::tokenize(text, Mode::Jsonc)
    }

    pub fn parse(text: &str) -> Result<ast::Node, MomoaError> {
        parse::parse(text, Mode::Jsonc)
    }
}

#[wasm_bindgen]
pub fn tokenize_js(input: &str, allow_comments: bool) -> JsValue {
    
    let result = if allow_comments {
        jsonc::tokenize(input).unwrap()
    } else {
        json::tokenize(input).unwrap()
    };
    
    serde_wasm_bindgen::to_value(&result).unwrap()
}
