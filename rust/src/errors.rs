use crate::tokens::TokenKind;
use serde::Serialize;
use std::fmt;
use thiserror::Error;

#[derive(Error, Clone, Copy, Serialize)]
pub enum MomoaError {
    #[error("Unexpected character {c:?} found. ({line:?}:{column:?})")]
    UnexpectedCharacter { c: char, line: usize, column: usize },

    #[error("Unexpected end of input found. ({line:?}:{column:?})")]
    UnexpectedEndOfInput { line: usize, column: usize },

    #[error("Unexpected element found. ({line:?}:{column:?})")]
    UnexpectedElement { line: usize, column: usize },

    #[error("Unexpected token {unexpected:?} found. ({line:?}:{column:?})")]
    UnexpectedToken {
        unexpected: TokenKind,
        line: usize,
        column: usize,
    },

    #[error("Expected token {expected:?} but found {unexpected:?}. ({line:?}:{column:?})")]
    MissingExpectedToken {
        expected: TokenKind,
        unexpected: TokenKind,
        line: usize,
        column: usize,
    },
}

impl fmt::Debug for MomoaError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.to_string())
    }
}
