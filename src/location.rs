use std::fmt;

use serde::Serialize;

#[derive(Clone, Copy, PartialEq, Eq, Serialize)]
pub struct Location {
    pub line: usize,
    pub column: usize,
    pub offset: usize
}

impl Location {
    pub(crate) fn new (line: usize, column: usize, offset: usize) -> Location {
        Location {
            line,
            column,
            offset
        }
    }

    pub(crate) fn advance(&self, char_count: usize) -> Location {
        Location {
            line: self.line,
            column: self.column + char_count,
            offset: self.offset + char_count
        }
    }

    pub(crate) fn advance_new_line(&self) -> Location {
        Location {
            line: self.line + 1,
            column: 0,
            offset: self.offset + 1
        }
    }
}

impl fmt::Debug for Location {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_fmt(format_args!("({:?}:{:?})", self.line, self.column))
    }
}


#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub struct LocationRange {
    pub start: Location,
    pub end: Location
}
