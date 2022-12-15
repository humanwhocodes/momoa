use std::fmt;
use thiserror::Error;
use crate::tokens::TokenKind;
use crate::location::Location;

#[derive(Error, Clone, Copy)]
pub enum MomoaError {
    #[error("Unexpected character {c:?} found.")]
    UnexpectedCharacter {
        c: char,
        loc: Location,
    },

    #[error("Unexpected end of input found.")]
    UnexpectedEndOfInput {
        loc: Location,
    },

    #[error("Unexpected element found.")]
    UnexpectedElement {
        loc: Location,
    },

    #[error("Unexpected token {unexpected:?} found.")]
    UnexpectedToken {
        unexpected: TokenKind,
        loc: Location,
    },

    #[error("Expected token {expected:?} but found {unexpected:?}.")]
    MissingExpectedToken {
        expected: TokenKind,
        unexpected: TokenKind,
        loc: Location,
    },
}

impl fmt::Debug for MomoaError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.to_string())
    }
}
