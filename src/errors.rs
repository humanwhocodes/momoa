use std::fmt;
use serde::Serialize;
use thiserror::Error;
use wasm_bindgen::prelude::wasm_bindgen;
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

impl MomoaError {
    pub(crate) fn to_js_error(&self) -> JSMomoaError {

        let loc = match self {
            Self::UnexpectedCharacter { c: _, loc } => loc,
            Self::UnexpectedElement { loc } => loc,
            Self::UnexpectedEndOfInput { loc } => loc,
            Self::UnexpectedToken { unexpected: _, loc } => loc,
            Self::MissingExpectedToken { unexpected: _, expected: _, loc } => loc
        };

        JSMomoaError {
            message: self.to_string(),
            line: loc.line,
            column: loc.column,
            offset: loc.offset
        }
    }
}

impl fmt::Debug for MomoaError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.to_string())
    }
}

//-----------------------------------------------------------------------------
// JSMomoaError
//-----------------------------------------------------------------------------

/// Standard struct that is suitable to pass to JavaScript
#[wasm_bindgen]
#[derive(Serialize)]
pub struct JSMomoaError {
    message: String,
    line: usize,
    column: usize,
    offset: usize
}
