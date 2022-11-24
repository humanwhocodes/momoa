use std::iter::Peekable;
use crate::errors::MomoaError;
use crate::location::*;


pub(crate) fn read_keyword<T: Iterator<Item = char>>(word:&str, it: &mut Peekable<T>, cursor:&Location) -> Result<Location, MomoaError> {

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

pub(crate) fn read_string<T: Iterator<Item = char>>(it: &mut Peekable<T>, cursor:&Location) -> Result<Location, MomoaError> {

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

                match it.peek() {
                    Some('"') | Some('\\') | Some('/') | Some('b') |
                    Some ('f') | Some('n') | Some('r') | Some('t') => {
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
                                Some(nc) => return Err(MomoaError::UnexpectedCharacter { c: nc, loc: cursor.advance(len) }),
                                None => return Err(MomoaError::UnexpectedEndOfInput { loc: cursor.advance(len) }),
                            }

                        }
                    }
                    Some(c) => return Err(MomoaError::UnexpectedCharacter { c: *c, loc: cursor.advance(len) }),
                    None => return Err(MomoaError::UnexpectedEndOfInput { loc: cursor.advance(len) }),
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

pub(crate) fn read_number<T: Iterator<Item = char>>(it: &mut Peekable<T>, cursor:&Location) -> Result<Location, MomoaError> {

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

pub(crate) fn read_line_comment<T: Iterator<Item = char>>(it: &mut Peekable<T>, cursor:&Location) -> Result<Location, MomoaError> {

    // the // was read outside of this function
    let mut len = 2;

    while let Some(&c) = it.peek() {
        match c {
            '\n' => {
                len += 1;
                it.next();
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

pub(crate) fn read_block_comment<T: Iterator<Item = char>>(it: &mut Peekable<T>, cursor:&Location) -> Result<Location, MomoaError> {

    // the // was read outside of this function
    let mut len = 2;

    while let Some(&c) = it.peek() {
        match c {
            '*' => {
                len += 1;
                it.next();

                match it.peek() {
                    Some('/') => {
                        len += 1;
                        it.next();
                        break;
                    }
                    Some(_nc) => continue,
                    None => return Err(MomoaError::UnexpectedEndOfInput { loc: cursor.advance(len) })
                }
            }
            _ => {
                len += 1;
                it.next();
            }
        }
    }

    Ok(cursor.advance(len))
}
