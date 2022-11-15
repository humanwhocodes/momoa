#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Location {
    pub line: usize,
    pub column: usize,
    pub offset: usize
}

impl Location {
    pub fn new (line: usize, column: usize, offset: usize) -> Location {
        Location {
            line,
            column,
            offset
        }
    }

    pub fn advance(&self, char_count: usize) -> Location {
        Location {
            line: self.line,
            column: self.column + char_count,
            offset: self.offset + char_count
        }
    }

    pub fn advance_new_line(&self) -> Location {
        Location {
            line: self.line + 1,
            column: 0,
            offset: self.offset + 1
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LocationRange {
    pub start: Location,
    pub end: Location
}
