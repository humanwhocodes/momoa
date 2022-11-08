use std::collections::HashMap;
use std::iter::Peekable;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TokenKind {
    LBrace,
    RBrace,
    LBracket,
    RBracket,
    Comma,
    Colon,
    True,
    False,
    Number,
    String,
    Null,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Location {
    line: usize,
    column: usize,
    offset: usize
}

impl Location {
    fn new (line: usize, column: usize, offset: usize) -> Location {
        Location {
            line,
            column,
            offset
        }
    }

    fn advance(&self, char_count: usize) -> Location {
        Location {
            line: self.line,
            column: self.column + char_count,
            offset: self.offset + char_count
        }
    }

    fn advance_new_line(&self) -> Location {
        Location {
            line: self.line + 1,
            column: 0,
            offset: self.offset + 1
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LocationRange {
    start: Location,
    end: Location
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Token {
    kind: TokenKind,
    loc: LocationRange
}

fn read_keyword<T: Iterator<Item = char>>(word:&str, it: &mut Peekable<T>, cursor:&Location) -> Result<Location, String> {

    for expected in word.chars().into_iter() {
        let actual = it.peek();
        if actual == Some(&expected) {
            it.next();
        } else {
            panic!("Unexpected character {:?} found.", &actual);
        }
    }

    Ok(cursor.advance(word.len()))
}


fn read_string<T: Iterator<Item = char>>(it: &mut Peekable<T>, cursor:&Location) -> Result<Location, String> {

    // check starting double quote
    let quote = it.peek();
    if quote == Some(&'"') {
        it.next();
    } else {
        return Err(format!("Unexpected character {:?} found.", &quote));
    }

    // track the size of the string so we can update the cursor
    let mut len = 1;
    let mut string_complete = false;

    while let Some(&c) = it.peek() {
        match c {

            // ending double quotes
            '"' => {
                len += 1;
                it.next();
                string_complete = true;
                break;
            }

            // escape characters
            '\\' => {
                len += 1;
                it.next();

                // unicode escapes in the format \uXXXX
                if it.peek() == Some(&'u') {
                    len += 1;
                    it.next();

                    // next four digits must be hexadecimals
                    for _i in 0..4 {
                        match it.next() {
                            Some(nc) if nc.is_ascii_hexdigit() => len += 1,
                            Some('"') => return Err("Unexpected end of string found.".to_string()),
                            Some(nc) => return Err(format!("Unexpected character {:?} found.", nc)),
                            None => return Err(format!("Unexpected end of input found.")),
                        }

                    }
                }
            }

            // any other character in the string
            _ => {
                len += 1;
                it.next();
            }
        }
    }

    if !string_complete {
        return Err("Unexpected end of input found.".to_string());
    }

    Ok(cursor.advance(len))
}

fn read_number<T: Iterator<Item = char>>(it: &mut Peekable<T>, cursor:&Location) -> Result<Location, String> {

    let mut len = 0;

    // first character may be a -
    let quote = it.peek();
    if quote == Some(&'-') {
        len += 1;
        it.next();
    }

    // next character must be a digit
    match it.peek() {
        Some(c) if c.is_numeric() => {
            len += 1;
            it.next();
        }
        Some(c) => return Err(format!("Unexpected character {:?} found.", c)),
        None => return Err(format!("Unexpected end of input found.")),
    }

    // possibly followed by more numbers
    while let Some(&c) = it.peek() {
        match c {
            '0'..='9' => {
                len += 1;
                it.next();
            }
            _ => break
        }
    }

    // at this point, we need to check for a dot (.)
    if Some(&'.') == it.peek() {
        len += 1;
        it.next();

        // TODO: must be followed by at least one number

        // dot must be followed by more numbers
        while let Some(&c) = it.peek() {
            match c {
                '0'..='9' => {
                    len += 1;
                    it.next();
                }
                _ => break
            }
        }

    }

    Ok(cursor.advance(len))

}


pub fn tokenize(input: &str) -> Result<Vec<Token>, String> {

    // for easier lookup of token kinds for characters
    let char_tokens: HashMap<&char,TokenKind> = HashMap::from([
        (&'[', TokenKind::LBracket),
        (&']', TokenKind::RBracket),
        (&'{', TokenKind::LBrace),
        (&'}', TokenKind::RBrace),
        (&',', TokenKind::Comma),
        (&':', TokenKind::Colon),
    ]);

    let mut result = Vec::new();
    let mut cursor = Location::new(1, 1, 0);
    let mut it = input.chars().peekable();

    while let Some(&c) = it.peek() {
        match c {
            '-' | '0'..='9' => {
                let new_cursor = read_number(&mut it, &cursor)?;
                result.push(Token {
                    kind: TokenKind::Number,
                    loc: LocationRange {
                        start: cursor,
                        end: new_cursor
                    }
                });

                cursor = new_cursor;
            }
            '[' | ']' | '{' | '}' | ':' | ',' => {

                let new_cursor = cursor.advance(1);
                result.push(Token {
                    kind: match char_tokens.get(&c) {
                        Some(token_kind) => *token_kind,
                        None => panic!("Unexpected character {:?}", c)
                    },
                    loc: LocationRange {
                        start: cursor,
                        end: new_cursor
                    }
                });

                cursor = new_cursor;
                it.next();
            }

            // strings
            '"' => {
                let new_cursor = read_string(&mut it, &cursor)?;
                result.push(Token {
                    kind: TokenKind::String,
                    loc: LocationRange {
                        start: cursor,
                        end: new_cursor
                    }
                });

                cursor = new_cursor;
            }

            // null
            'n' => {
                let new_cursor = read_keyword("null", &mut it, &cursor)?;
                result.push(Token {
                    kind: TokenKind::Null,
                    loc: LocationRange {
                        start: cursor,
                        end: new_cursor
                    }
                });

                cursor = new_cursor;
            }

            // true
            't' => {
                let new_cursor = read_keyword("true", &mut it, &cursor)?;
                result.push(Token {
                    kind: TokenKind::True,
                    loc: LocationRange {
                        start: cursor,
                        end: new_cursor
                    }
                });

                cursor = new_cursor;
            }

            // false
            'f' => {
                let new_cursor = read_keyword("false", &mut it, &cursor)?;
                result.push(Token {
                    kind: TokenKind::False,
                    loc: LocationRange {
                        start: cursor,
                        end: new_cursor
                    }
                });

                cursor = new_cursor;
            }

            // whitespace
            ' ' | '\t' | '\r' => {
                cursor = cursor.advance(1);
                it.next();
            }

            // newlines
            '\n' => {
                cursor = cursor.advance_new_line();
                it.next();
            } 
            _ => {
                return Err(format!("unexpected character {}", c));
            }
        }
    }
    Ok(result)
}



#[cfg(test)]
mod tests {
    use super::*;




    #[test]
    fn should_tokenize_null() {
        let result = tokenize("null").unwrap();
        assert_eq!(result[0].kind, TokenKind::Null);
        assert_eq!(result[0].loc.start, Location {
            line: 1,
            column: 1,
            offset: 0
        });
        assert_eq!(result[0].loc.end, Location {
            line: 1,
            column: 5,
            offset: 4
        });
    }

    #[test]
    fn should_tokenize_true() {
        let result = tokenize("true").unwrap();
        assert_eq!(result[0].kind, TokenKind::True);
        assert_eq!(result[0].loc.start, Location {
            line: 1,
            column: 1,
            offset: 0
        });
        assert_eq!(result[0].loc.end, Location {
            line: 1,
            column: 5,
            offset: 4
        });
    }

    #[test]
    fn should_tokenize_false() {
        let result = tokenize("false").unwrap();
        assert_eq!(result[0].kind, TokenKind::False);
        assert_eq!(result[0].loc.start, Location {
            line: 1,
            column: 1,
            offset: 0
        });
        assert_eq!(result[0].loc.end, Location {
            line: 1,
            column: 6,
            offset: 5
        });
    }

    #[test]
    fn should_tokenize_integer() {
        let result = tokenize("250").unwrap();
        assert_eq!(result[0].kind, TokenKind::Number);
        assert_eq!(result[0].loc.start, Location {
            line: 1,
            column: 1,
            offset: 0
        });
        assert_eq!(result[0].loc.end, Location {
            line: 1,
            column: 4,
            offset: 3
        });
    }

    #[test]
    fn should_tokenize_single_digit() {
        let code = "0";
        let result = tokenize(code).unwrap();
        assert_eq!(result[0].kind, TokenKind::Number);
        assert_eq!(result[0].loc.start, Location {
            line: 1,
            column: 1,
            offset: 0
        });
        assert_eq!(result[0].loc.end, Location {
            line: 1,
            column: 1 + code.len(),
            offset: code.len()
        });
    }

    #[test]
    fn should_tokenize_negative_integer() {
        let result = tokenize("-12").unwrap();
        assert_eq!(result[0].kind, TokenKind::Number);
        assert_eq!(result[0].loc.start, Location {
            line: 1,
            column: 1,
            offset: 0
        });
        assert_eq!(result[0].loc.end, Location {
            line: 1,
            column: 4,
            offset: 3
        });
    }

    #[test]
    fn should_tokenize_negative_float() {
        let result = tokenize("12.0").unwrap();
        assert_eq!(result[0].kind, TokenKind::Number);
        assert_eq!(result[0].loc.start, Location {
            line: 1,
            column: 1,
            offset: 0
        });
        assert_eq!(result[0].loc.end, Location {
            line: 1,
            column: 5,
            offset: 4
        });
    }

    #[test]
    fn should_tokenize_negative_negative_float() {
        let result = tokenize("-987.0").unwrap();
        assert_eq!(result[0].kind, TokenKind::Number);
        assert_eq!(result[0].loc.start, Location {
            line: 1,
            column: 1,
            offset: 0
        });
        assert_eq!(result[0].loc.end, Location {
            line: 1,
            column: 7,
            offset: 6
        });
    }

    #[test]
    fn should_tokenize_negative_negative_long_float() {
        let code = "-987.0842930349283";
        let result = tokenize(code).unwrap();
        assert_eq!(result[0].kind, TokenKind::Number);
        assert_eq!(result[0].loc.start, Location {
            line: 1,
            column: 1,
            offset: 0
        });
        assert_eq!(result[0].loc.end, Location {
            line: 1,
            column: 1 + code.len(),
            offset: code.len()
        });
    }

    #[test]
    #[should_panic(expected="Unexpected end of number found.")]
    fn should_panic_unexpected_end_of_input_reading_minus() {
        tokenize("-").unwrap();
    }

    #[test]
    #[should_panic(expected="Unexpected end of input found.")]
    fn should_panic_unexpected_end_of_input_reading_float() {
        tokenize("5.").unwrap();
    }

    #[test]
    fn should_tokenize_simple_string() {
        let result = tokenize("\"hello\"").unwrap();
        assert_eq!(result[0].kind, TokenKind::String);
        assert_eq!(result[0].loc.start, Location {
            line: 1,
            column: 1,
            offset: 0
        });
        assert_eq!(result[0].loc.end, Location {
            line: 1,
            column: 8,
            offset: 7
        });
    }

    #[test]
    fn should_tokenize_string_with_unicode_escapes() {
        let result = tokenize("\"hello\\u32AF\"").unwrap();
        assert_eq!(result[0].kind, TokenKind::String);
        assert_eq!(result[0].loc.start, Location {
            line: 1,
            column: 1,
            offset: 0
        });
        assert_eq!(result[0].loc.end, Location {
            line: 1,
            column: 14,
            offset: 13
        });
    }

    #[test]
    #[should_panic(expected="Unexpected character 'X' found.")]
    fn should_panic_unexpected_unicode_escape_character() {
        tokenize("\"hello\\u32AX\"").unwrap();
    }

    #[test]
    #[should_panic(expected="Unexpected end of string found.")]
    fn should_panic_premature_unicode_escape_end() {
        tokenize("\"hello\\u32A\"").unwrap();
    }

    #[test]
    #[should_panic(expected="Unexpected end of input found.")]
    fn should_panic_unicode_escape_end_of_input() {
        tokenize("\"hello\\u32A").unwrap();
    }

    #[test]
    #[should_panic(expected="Unexpected end of input found.")]
    fn should_panic_unexpected_end_of_string() {
        tokenize("\"hello").unwrap();
    }

}
