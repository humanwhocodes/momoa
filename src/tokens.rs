use crate::prelude::*;

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

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Token {
    kind: TokenKind,
    loc: LocationRange
}

fn read_keyword<T: Iterator<Item = char>>(word:&str, it: &mut Peekable<T>, cursor:&Location) -> Result<Location, MomoaError> {

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


fn read_string<T: Iterator<Item = char>>(it: &mut Peekable<T>, cursor:&Location) -> Result<Location, MomoaError> {

    // check starting double quote
    let quote = it.peek();
    match quote {
        Some(&'"') => {
            it.next();
        }
        Some(c) => {
            return Err(MomoaError::UnexpectedCharacter { c: *c, loc: *cursor });
        }
        _ => {
            return Err(MomoaError::UnexpectedEndOfInput { loc: *cursor });
        }
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
                            Some(nc) => return Err(MomoaError::UnexpectedCharacter { c: nc, loc: cursor.advance(len) }),
                            None => return Err(MomoaError::UnexpectedEndOfInput { loc: cursor.advance(len) }),
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
        return Err(MomoaError::UnexpectedEndOfInput { loc: cursor.advance(len) });
    }

    Ok(cursor.advance(len))
}

fn read_number<T: Iterator<Item = char>>(it: &mut Peekable<T>, cursor:&Location) -> Result<Location, MomoaError> {

    let mut len = 0;

    // first character may be a -
    let quote = it.peek();
    if quote == Some(&'-') {
        len += 1;
        it.next();
    }

    // next character must be a digit
    let mut first_zero = false;
    match it.peek() {
        Some(c) if c.is_numeric() => {
            first_zero = c == &'0';
            len += 1;
            it.next();
        }
        Some(c) => return Err(MomoaError::UnexpectedCharacter { c: *c, loc: cursor.advance(len) }),
        None => return Err(MomoaError::UnexpectedEndOfInput { loc: cursor.advance(len) }),
    }

    // possibly followed by more numbers
    while let Some(&c) = it.peek() {
        match c {
            '0'..='9' => {
                if first_zero {
                    return Err(MomoaError::UnexpectedCharacter { c, loc: cursor.advance(len) });
                }

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

        // TODO: Verify that there is at least one number

        // must be followed by at least one number
        if None == it.peek() {
            return Err(MomoaError::UnexpectedEndOfInput { loc: cursor.advance(len) });
        }

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

    // and now let's check for E or e
    let has_e = match it.peek() {
        Some('e') | Some('E') => true,
        _ => false
    };
    if has_e {

        // consume the E
        len += 1;
        it.next();

        // check if there's a + or -
        let has_sign = match it.peek() {
            Some('-') | Some('+') => true,
            _ => false
        };

        if has_sign {
            len += 1;
            it.next();
        }

        // now we need at least one digit
        let has_digit = match it.peek() {
            Some(c) if c.is_digit(10) => true,
            _ => false
        };

        if !has_digit {
            return Err(MomoaError::UnexpectedEndOfInput { loc: cursor.advance(len) });
        }

        len += 1;
        it.next();

        // continue consuming digits until there are no more
        while let Some(c) = it.peek() {
            match c {
                c if c.is_digit(10) => {
                    len += 1;
                    it.next();
                }
                _ => break
            }
        }

    }

    Ok(cursor.advance(len))

}


pub fn tokenize(input: &str) -> Result<Vec<Token>, MomoaError> {

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
                        None => return Err(MomoaError::UnexpectedCharacter { c, loc: new_cursor })
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
                return Err(MomoaError::UnexpectedCharacter { c, loc: cursor.advance(1) });
            }
        }
    }
    Ok(result)
}
