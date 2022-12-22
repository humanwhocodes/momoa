use std::collections::HashMap;
use std::iter::Peekable;
use std::str::Chars;
use crate::errors::MomoaError;
use crate::location::*;
use crate::readers::*;
use crate::Mode;
use serde::Deserialize;
use serde::Serialize;

//-----------------------------------------------------------------------------
// TokenKind
//-----------------------------------------------------------------------------

/// The type of token.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TokenKind {
    LBrace,
    RBrace,
    LBracket,
    RBracket,
    Comma,
    Colon,
    Boolean,
    Number,
    String,
    Null,
    LineComment,
    BlockComment
}

//-----------------------------------------------------------------------------
// Token
//-----------------------------------------------------------------------------

/// All of the information about a token.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Token {

    #[serde(rename = "type")]
    pub kind: TokenKind,
    pub loc: LocationRange
}

//-----------------------------------------------------------------------------
// Tokens
//-----------------------------------------------------------------------------

pub struct Tokens<'a> {
    mode: Mode,
    it: Peekable<Chars<'a>>,
    cursor: Location,
}

impl<'a> Tokens<'a> {
    pub fn new(text: &'a str, mode: Mode) -> Self {
        Tokens {
            it: text.chars().peekable(),
            cursor: Location::new(1, 1, 0),
            mode
        }
    }

}

impl<'a> Iterator for Tokens<'a> {

    type Item = Result<Token,MomoaError>;

    fn next(&mut self) -> Option<Self::Item> {

        // TODO: Find a way to move this elsewhere
        // for easier lookup of token kinds for characters
        let char_tokens: HashMap<&char,TokenKind> = HashMap::from([
            (&'[', TokenKind::LBracket),
            (&']', TokenKind::RBracket),
            (&'{', TokenKind::LBrace),
            (&'}', TokenKind::RBrace),
            (&',', TokenKind::Comma),
            (&':', TokenKind::Colon),
        ]);

        let it = &mut self.it;
        
        while let Some(&c) = it.peek() {

            let cursor = self.cursor;
            
            match c {
                '-' | '0'..='9' => {
                    let read_result = read_number(it, &cursor);
                    if read_result.is_err() {
                        return Some(Err(read_result.err().unwrap()));
                    }

                    let new_cursor = read_result.unwrap();
                    self.cursor = new_cursor;

                    return Some(Ok(Token {
                        kind: TokenKind::Number,
                        loc: LocationRange {
                            start: cursor,
                            end: new_cursor
                        }
                    }));
                }
                '[' | ']' | '{' | '}' | ':' | ',' => {

                    let new_cursor = cursor.advance(1);
                    self.cursor = new_cursor;
                    it.next();

                    return Some(Ok(Token {
                        kind: match char_tokens.get(&c) {
                            Some(token_kind) => *token_kind,
                            None => return Some(Err(MomoaError::UnexpectedCharacter { c, loc: new_cursor }))
                        },
                        loc: LocationRange {
                            start: cursor,
                            end: new_cursor
                        }
                    }));
                }

                // strings
                '"' => {
                    let read_result = read_string(it, &cursor);
                    if read_result.is_err() {
                        return Some(Err(read_result.err().unwrap()));
                    }

                    let new_cursor = read_result.unwrap();
                    self.cursor = new_cursor;

                    return Some(Ok(Token {
                        kind: TokenKind::String,
                        loc: LocationRange {
                            start: cursor,
                            end: new_cursor
                        }
                    }));
                }

                // null
                'n' => {
                    let read_result = read_keyword("null", it, &cursor);
                    if read_result.is_err() {
                        return Some(Err(read_result.err().unwrap()));
                    }

                    let new_cursor = read_result.unwrap();
                    self.cursor = new_cursor;

                    return Some(Ok(Token {
                        kind: TokenKind::Null,
                        loc: LocationRange {
                            start: cursor,
                            end: new_cursor
                        }
                    }));

                }

                // true
                't' => {
                    let read_result = read_keyword("true", it, &cursor);
                    if read_result.is_err() {
                        return Some(Err(read_result.err().unwrap()));
                    }

                    let new_cursor = read_result.unwrap();
                    self.cursor = new_cursor;

                    return Some(Ok(Token {
                        kind: TokenKind::Boolean,
                        loc: LocationRange {
                            start: cursor,
                            end: new_cursor
                        }
                    }));

                }

                // false
                'f' => {
                    let read_result = read_keyword("false", it, &cursor);
                    if read_result.is_err() {
                        return Some(Err(read_result.err().unwrap()));
                    }

                    let new_cursor = read_result.unwrap();
                    self.cursor = new_cursor;

                    return Some(Ok(Token {
                        kind: TokenKind::Boolean,
                        loc: LocationRange {
                            start: cursor,
                            end: new_cursor
                        }
                    }));

                }

                // comments
                '/' if self.mode == Mode::Jsonc => {

                    it.next();

                    // check the next character
                    match it.peek() {
                        Some('/') => {
                            it.next();
                            let read_result = read_line_comment(it, &cursor);
                            if read_result.is_err() {
                                return Some(Err(read_result.err().unwrap()));
                            }

                            let new_cursor = read_result.unwrap();
                            self.cursor = new_cursor;

                            return Some(Ok(Token {
                                kind: TokenKind::LineComment,
                                loc: LocationRange {
                                    start: cursor,
                                    end: new_cursor
                                }
                            }));


                        }
                        Some('*') => {
                            it.next();

                            let read_result = read_block_comment(it, &cursor);
                            if read_result.is_err() {
                                return Some(Err(read_result.err().unwrap()));
                            }

                            let new_cursor = read_result.unwrap();
                            self.cursor = new_cursor;

                            return Some(Ok(Token {
                                kind: TokenKind::BlockComment,
                                loc: LocationRange {
                                    start: cursor,
                                    end: new_cursor
                                }
                            }));

                        }
                        _ => return Some(Err(MomoaError::UnexpectedCharacter { c, loc: cursor.advance(1) }))
                    }
                }

                // whitespace
                ' ' | '\t' | '\r' => {
                    self.cursor = self.cursor.advance(1);
                    it.next();
                }

                // newlines
                '\n' => {
                    self.cursor = self.cursor.advance_new_line();
                    it.next();
                } 
                _ => {
                    return Some(Err(MomoaError::UnexpectedCharacter { c, loc: cursor.advance(1) }));
                }
            }
        }

        None
        
    }

}

pub fn tokenize(code: &str, mode: Mode) -> Result<Vec<Token>, MomoaError> {

    let tokens = Tokens::new(code, mode);
    let mut result = Vec::new();

    for iteration_result in tokens {
        let token = iteration_result?;
        result.push(token);
    }

    Ok(result)
}
