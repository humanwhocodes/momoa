mod tokens;
mod errors;
mod location;

// consolidate imports from local files and external crates
mod prelude {
    pub use std::collections::HashMap;
    pub use std::fmt;
    pub use std::iter::Peekable;
    pub use thiserror::Error;

    pub use crate::errors::MomoaError;
    pub use crate::location::{Location, LocationRange};
    pub use crate::tokens::{tokenize, TokenKind};
}

// expose specific apis from the library
pub use prelude::{tokenize, Location, TokenKind};