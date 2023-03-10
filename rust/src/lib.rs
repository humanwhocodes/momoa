pub mod ast;
mod errors;
mod location;
mod mode;
mod parse;
mod readers;
mod tokens;

pub use errors::MomoaError;
pub use location::{Location, LocationRange};
pub use mode::Mode;
pub use tokens::{Token, TokenKind};

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
