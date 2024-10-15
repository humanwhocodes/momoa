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
    use parse::ParserOptions;

    pub fn tokenize(text: &str) -> Result<Vec<Token>, MomoaError> {
        tokens::tokenize(text, Mode::Json)
    }

    pub fn parse(text: &str) -> Result<ast::Node, MomoaError> {
        parse::parse(text, Mode::Json, None)
    }

    pub fn parse_with_trailing_commas(text: &str) -> Result<ast::Node, MomoaError> {
        parse::parse(text, Mode::Json, Some(ParserOptions { allow_trailing_commas: true }))
    }
}

pub mod jsonc {
    use crate::*;
    use parse::ParserOptions;

    pub fn tokenize(text: &str) -> Result<Vec<Token>, MomoaError> {
        tokens::tokenize(text, Mode::Jsonc)
    }

    pub fn parse(text: &str) -> Result<ast::Node, MomoaError> {
        parse::parse(text, Mode::Jsonc, None)
    }

    pub fn parse_with_trailing_commas(text: &str) -> Result<ast::Node, MomoaError> {
        parse::parse(text, Mode::Jsonc, Some(ParserOptions { allow_trailing_commas: true }))
    }

}
