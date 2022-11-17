use crate::prelude::*;

#[derive(Error)]
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

impl fmt::Debug for MomoaError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.to_string())
    }
}
