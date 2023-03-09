use std::fmt;
use serde::Serialize;
use thiserror::Error;
use crate::tokens::TokenKind;
use crate::location::Location;

#[derive(Error, Clone, Copy, Serialize)]
pub enum MomoaError {
    #[error("Unexpected character {c:?} found. {loc:?}")]
    UnexpectedCharacter {
        c: char,
        loc: Location,
    },

    #[error("Unexpected end of input found. {loc:?}")]
    UnexpectedEndOfInput {
        loc: Location,
    },

    #[error("Unexpected element found. {loc:?}")]
    UnexpectedElement {
        loc: Location,
    },

    #[error("Unexpected token {unexpected:?} found. {loc:?}")]
    UnexpectedToken {
        unexpected: TokenKind,
        loc: Location,
    },

    #[error("Expected token {expected:?} but found {unexpected:?}. {loc:?}")]
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
