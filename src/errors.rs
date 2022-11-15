use thiserror::Error;
use crate::location::Location;

#[derive(Error, Debug)]
pub enum MomoaError {
    #[error("Unexpected character {c:?} found.")]
    UnexpectedCharacter {
        c: char,
        loc: Location,
    },
    #[error("Unexpected end of input found.")]
    UnexpectedEndOfInput {
        loc: Location,
    }
}
