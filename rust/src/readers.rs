use crate::errors::MomoaError;
use crate::location::*;
use std::iter::Peekable;

pub(crate) fn read_keyword<T: Iterator<Item = char>>(
    word: &str,
    it: &mut Peekable<T>,
    cursor: &Location,
) -> Result<Location, MomoaError> {
    let mut len = 0;

    for expected in word.chars().into_iter() {
        let peeked = it.peek();
        match peeked {
            Some(actual) if *actual == expected => {
                len += 1;
                it.next();
            }
            Some(actual) => {
                let new_cursor = cursor.advance(len);
                return Err(MomoaError::UnexpectedCharacter {
                    c: *actual,
                    line: new_cursor.line,
                    column: new_cursor.column,
                });
            }
            None => {
                let new_cursor = cursor.advance(len);
                return Err(MomoaError::UnexpectedEndOfInput {
                    line: new_cursor.line,
                    column: new_cursor.column,
                });
            }
        }
    }

    Ok(cursor.advance(word.len()))
}

pub(crate) fn read_string<T: Iterator<Item = char>>(
    it: &mut Peekable<T>,
    cursor: &Location,
) -> Result<Location, MomoaError> {
    // check starting double quote
    let quote = it.peek();
    match quote {
        Some(&'"') => {
            it.next();
        }
        Some(c) => {
            return Err(MomoaError::UnexpectedCharacter {
                c: *c,
                line: cursor.line,
                column: cursor.column,
            });
        }
        _ => {
            return Err(MomoaError::UnexpectedEndOfInput {
                line: cursor.line,
                column: cursor.column,
            });
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

                match it.peek() {
                    Some('"') | Some('\\') | Some('/') | Some('b') | Some('f') | Some('n')
                    | Some('r') | Some('t') => {
                        len += 1;
                        it.next();
                    }
                    Some('u') => {
                        len += 1;
                        it.next();

                        // next four digits must be hexadecimals
                        for _i in 0..4 {
                            match it.next() {
                                Some(nc) if nc.is_ascii_hexdigit() => len += 1,
                                Some(nc) => {
                                    let new_cursor = cursor.advance(len);
                                    return Err(MomoaError::UnexpectedCharacter {
                                        c: nc,
                                        line: new_cursor.line,
                                        column: new_cursor.column,
                                    });
                                }
                                None => {
                                    let new_cursor = cursor.advance(len);
                                    return Err(MomoaError::UnexpectedEndOfInput {
                                        line: new_cursor.line,
                                        column: new_cursor.column,
                                    });
                                }
                            }
                        }
                    }
                    Some(c) => {
                        let new_cursor = cursor.advance(len);
                        return Err(MomoaError::UnexpectedCharacter {
                            c: *c,
                            line: new_cursor.line,
                            column: new_cursor.column,
                        });
                    }
                    None => {
                        let new_cursor = cursor.advance(len);
                        return Err(MomoaError::UnexpectedEndOfInput {
                            line: new_cursor.line,
                            column: new_cursor.column,
                        });
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
        let new_cursor = cursor.advance(len);
        return Err(MomoaError::UnexpectedEndOfInput {
            line: new_cursor.line,
            column: new_cursor.column,
        });
    }

    Ok(cursor.advance(len))
}

pub(crate) fn read_number<T: Iterator<Item = char>>(
    it: &mut Peekable<T>,
    cursor: &Location,
) -> Result<Location, MomoaError> {
    let mut len = 0;

    // first character may be a -
    let quote = it.peek();
    if quote == Some(&'-') {
        len += 1;
        it.next();
    }

    // next character must be a digit
    let first_zero;
    match it.peek() {
        Some(c) if c.is_numeric() => {
            first_zero = c == &'0';
            len += 1;
            it.next();
        }
        Some(c) => {
            let new_cursor = cursor.advance(len);
            return Err(MomoaError::UnexpectedCharacter {
                c: *c,
                line: new_cursor.line,
                column: new_cursor.column,
            });
        }
        None => {
            let new_cursor = cursor.advance(len);
            return Err(MomoaError::UnexpectedEndOfInput {
                line: new_cursor.line,
                column: new_cursor.column,
            });
        }
    }

    // possibly followed by more numbers
    while let Some(&c) = it.peek() {
        match c {
            '0'..='9' => {
                if first_zero {
                    let new_cursor = cursor.advance(len);
                    return Err(MomoaError::UnexpectedCharacter {
                        c,
                        line: new_cursor.line,
                        column: new_cursor.column,
                    });
                }

                len += 1;
                it.next();
            }
            _ => break,
        }
    }

    // at this point, we need to check for a dot (.)
    if Some(&'.') == it.peek() {
        len += 1;
        it.next();

        // TODO: Verify that there is at least one number

        // must be followed by at least one number
        if None == it.peek() {
            let new_cursor = cursor.advance(len);
            return Err(MomoaError::UnexpectedEndOfInput {
                line: new_cursor.line,
                column: new_cursor.column,
            });
        }

        // dot must be followed by more numbers
        while let Some(&c) = it.peek() {
            match c {
                '0'..='9' => {
                    len += 1;
                    it.next();
                }
                _ => break,
            }
        }
    }

    // and now let's check for E or e
    let has_e = match it.peek() {
        Some('e') | Some('E') => true,
        _ => false,
    };
    if has_e {
        // consume the E
        len += 1;
        it.next();

        // check if there's a + or -
        let has_sign = match it.peek() {
            Some('-') | Some('+') => true,
            _ => false,
        };

        if has_sign {
            len += 1;
            it.next();
        }

        // now we need at least one digit
        let has_digit = match it.peek() {
            Some(c) if c.is_digit(10) => true,
            _ => false,
        };

        if !has_digit {
            let new_cursor = cursor.advance(len);
            return Err(MomoaError::UnexpectedEndOfInput {
                line: new_cursor.line,
                column: new_cursor.column,
            });
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
                _ => break,
            }
        }
    }

    Ok(cursor.advance(len))
}

pub(crate) fn read_line_comment<T: Iterator<Item = char>>(
    it: &mut Peekable<T>,
    cursor: &Location,
) -> Result<Location, MomoaError> {
    // the // was read outside of this function
    let mut len = 2;

    while let Some(&c) = it.peek() {
        match c {
            '\n' => {
                break;
            }
            _ => {
                len += 1;
                it.next();
            }
        }
    }

    Ok(cursor.advance(len))
}

pub(crate) fn read_block_comment<T: Iterator<Item = char>>(
    it: &mut Peekable<T>,
    cursor: &Location,
) -> Result<Location, MomoaError> {
    // the /* was read outside of this function
    let mut len = 2;
    let mut complete = false;
    let mut comment_cursor = cursor.clone();
    let mut last_char = '*';

    while let Some(&c) = it.peek() {
        /*
         * Tracking across newlines is a bit tricky. Basically, the
         * newline character itself is considered the last character of a
         * line for our purposes. So, we need to move to the next line only
         * after we have seen the newline character AND another character
         * after that.
         */
        if last_char == '\n' {
            comment_cursor = comment_cursor.advance_and_new_line(len);
            len = 1;
        } else {
            len += 1;
        }

        last_char = c;
        it.next();

        if c == '*' {
            match it.peek() {
                Some('/') => {
                    len += 1;
                    it.next();
                    complete = true;
                    break;
                }
                Some(_) => continue,
                None => {
                    let new_cursor = comment_cursor.advance(len);
                    return Err(MomoaError::UnexpectedEndOfInput {
                        line: new_cursor.line,
                        column: new_cursor.column,
                    });
                }
            }
        }
    }

    if !complete {
        let new_cursor = cursor.advance(len);
        return Err(MomoaError::UnexpectedEndOfInput {
            line: new_cursor.line,
            column: new_cursor.column,
        });
    }

    Ok(comment_cursor.advance(len))
}
