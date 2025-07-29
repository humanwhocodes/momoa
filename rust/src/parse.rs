use crate::ast::*;
use crate::errors::MomoaError;
use crate::location::*;
use crate::tokens::*;
use crate::Mode;
use std::collections::HashMap;

/// Calculates the location at the end of the given text.
fn get_end_location(text: &str) -> Location {
    let mut line = 1;
    let mut column = 1;
    
    for ch in text.chars() {
        match ch {
            '\n' => {
                line += 1;
                column = 1;
            }
            '\r' => {
                // Handle \r\n as a single line ending
                line += 1;
                column = 1;
            }
            _ => {
                column += 1;
            }
        }
    }
    
    Location {
        line,
        column,
        offset: text.len(),
    }
}

//-----------------------------------------------------------------------------
// Options
//-----------------------------------------------------------------------------
pub struct ParserOptions {
    pub allow_trailing_commas: bool,
}

impl Default for ParserOptions {
    fn default() -> Self {
        ParserOptions {
            allow_trailing_commas: false,
        }
    }
}

//-----------------------------------------------------------------------------
// Parser
//-----------------------------------------------------------------------------

struct Parser<'a> {
    text: &'a str,
    it: Tokens<'a>,
    loc: Location,
    tokens: Vec<Token>,
    peeked: Option<Token>,
    options: ParserOptions,
}

impl<'a> Parser<'a> {
    pub fn new(text: &'a str, mode: Mode, options: Option<ParserOptions>) -> Self {
        Parser {
            text,
            it: Tokens::new(text, mode),
            tokens: Vec::new(),
            loc: Location {
                line: 1,
                column: 1,
                offset: 0,
            },
            peeked: None,
            options: options.unwrap_or_default(),
        }
    }

    fn get_value_loc(&self, value: &Node) -> LocationRange {
        match value {
            Node::Document(d) => d.loc,
            Node::Array(array) => array.loc,
            Node::Boolean(b) => b.loc,
            Node::Element(e) => e.loc,
            Node::Member(m) => m.loc,
            Node::Number(n) => n.loc,
            Node::Null(n) => n.loc,
            Node::Object(o) => o.loc,
            Node::String(s) => s.loc,
        }
    }

    /// Parses the text contained in the parser into a `Node`.
    pub fn parse(&mut self) -> Result<Node, MomoaError> {
        let body = self.parse_value()?;

        /*
         * For regular JSON, there should be no further tokens; JSONC may have
         * comments after the body.
         */
        while let Some(token_result) = self.next_token() {
            return Err(match token_result {
                Ok(token)
                    if token.kind == TokenKind::LineComment
                        || token.kind == TokenKind::BlockComment =>
                {
                    continue
                }
                Ok(token) => MomoaError::UnexpectedToken {
                    unexpected: token.kind,
                    line: token.loc.start.line,
                    column: token.loc.start.column,
                },
                Err(error) => error,
            });
        }

        let text_end_location = get_end_location(self.text);
        let doc_loc = LocationRange {
            start: Location {
                line: 1,
                column: 1,
                offset: 0,
            },
            end: text_end_location,
        };

        Ok(Node::Document(Box::new(DocumentNode {
            body,
            loc: doc_loc,
            tokens: self.tokens.clone(),
        })))
    }

    fn parse_value(&mut self) -> Result<Node, MomoaError> {
        // while loop instead of if because we need to account for comments
        while let Some(token_result) = self.peek_token() {
            match token_result {
                Ok(token) => match token.kind {
                    TokenKind::LBrace => return self.parse_object(),
                    TokenKind::LBracket => return self.parse_array(),
                    TokenKind::Boolean => return self.parse_boolean(),
                    TokenKind::Number => return self.parse_number(),
                    TokenKind::Null => return self.parse_null(),
                    TokenKind::String => return self.parse_string(),
                    _ => panic!("Not implemented"),
                },
                Err(error) => return Err(error),
            }
        }

        // otherwise we've hit an unexpected end of input
        Err(MomoaError::UnexpectedEndOfInput {
            line: self.loc.line,
            column: self.loc.column,
        })
    }

    /// Advances to the next token without returning it.
    fn eat_token(&mut self) {
        self.next_token();
    }

    /// Advances to the next token and returns it or errors.
    fn next_token(&mut self) -> Option<Result<Token, MomoaError>> {
        if let Some(token) = self.peeked {
            self.peeked = None;
            return Some(Ok(token));
        }

        self.it.next()
    }

    /// Returns the next token or error without advancing the iterator.
    /// Muliple calls always return the same result.
    fn peek_token(&mut self) -> Option<Result<Token, MomoaError>> {
        // if there's a peeked token, return it and don't overwrite it
        if let Some(token) = self.peeked {
            return Some(Ok(token));
        }

        // if there's no peeked token, try to get a new one
        while let Some(token_result) = self.it.next() {
            match token_result {
                /*
                 * JSON vs. JSONC: Only the JSONC tokenization will return
                 * a comment. The JSON tokenization throws an error if it
                 * finds a comment, so it's safe to not verify if comments
                 * are allowed here.
                 */
                Ok(token)
                    if token.kind == TokenKind::LineComment
                        || token.kind == TokenKind::BlockComment =>
                {
                    self.loc = token.loc.start;
                    self.tokens.push(token);
                    continue;
                }
                Ok(token) => {
                    self.peeked = Some(token);
                    return Some(Ok(token));
                }
                Err(error) => {
                    return Some(Err(error));
                }
            }
        }

        None
    }

    /// Advance only if the next token matches the given `kind`.
    fn maybe_match(&mut self, kind: TokenKind) -> Option<Result<Token, MomoaError>> {
        // check to see if there's another result coming from the iterator
        while let Some(next_token_result) = self.peek_token() {
            match next_token_result {
                Ok(next_token) => match next_token.kind {
                    _k if _k == kind => {
                        self.eat_token();
                        self.loc = next_token.loc.start;
                        self.tokens.push(next_token);
                        return Some(Ok(next_token));
                    }
                    _ => return None,
                },
                Err(error) => return Some(Err(error)),
            }
        }

        // otherwise we didn't match anything
        None
    }

    /// Advance to the next token and throw an error if it doesn't match
    /// `kind`.
    fn must_match(&mut self, kind: TokenKind) -> Result<Token, MomoaError> {
        // check if there is a token first
        if let Some(next_token_result) = self.next_token() {
            let next_token = next_token_result.unwrap();

            if next_token.kind == kind {
                self.loc = next_token.loc.start;
                self.tokens.push(next_token);

                return Ok(next_token);
            }

            return Err(MomoaError::UnexpectedToken {
                unexpected: next_token.kind,
                line: next_token.loc.start.line,
                column: next_token.loc.start.column,
            });
        }

        Err(MomoaError::UnexpectedEndOfInput {
            line: self.loc.line,
            column: self.loc.column,
        })
    }

    fn get_text(&self, start: usize, end: usize) -> &str {
        &self.text[start..end]
    }

    fn parse_boolean(&mut self) -> Result<Node, MomoaError> {
        let token = self.must_match(TokenKind::Boolean)?;
        let text = self.get_text(token.loc.start.offset, token.loc.end.offset);
        let value = text == "true";

        return Ok(Node::Boolean(Box::new(ValueNode {
            value,
            loc: token.loc,
        })));
    }

    fn parse_number(&mut self) -> Result<Node, MomoaError> {
        let token = self.must_match(TokenKind::Number)?;
        let text = self.get_text(token.loc.start.offset, token.loc.end.offset);
        let value = text.parse::<f64>().unwrap();

        return Ok(Node::Number(Box::new(ValueNode {
            value,
            loc: token.loc,
        })));
    }

    fn parse_null(&mut self) -> Result<Node, MomoaError> {
        let token = self.must_match(TokenKind::Null)?;

        return Ok(Node::Null(Box::new(NullNode { loc: token.loc })));
    }

    fn parse_string(&mut self) -> Result<Node, MomoaError> {
        let token = self.must_match(TokenKind::String)?;
        let text = self.get_text(token.loc.start.offset, token.loc.end.offset);

        // TODO: Find a way to move this elsewhere
        // for easier lookup of token kinds for characters
        let escaped_chars: HashMap<&char, char> = HashMap::from([
            (&'"', '"'),
            (&'\\', '\\'),
            (&'/', '/'),
            (&'b', '\u{0008}'),
            (&'f', '\u{000c}'),
            (&'n', '\n'),
            (&'r', '\r'),
            (&'t', '\t'),
        ]);

        /*
         * Because we are building up a string, we want to avoid unnecessary
         * reallocations as data is added. So we create a string with an initial
         * capacity of the length of the text minus 2 (for the two quote
         * characters), which will always be enough room to represent the string
         * value.
         */
        let mut value = String::with_capacity(text.len() - 2);

        /*
         * We need to build up a string from the characters because we need to
         * interpret certain escape characters that may occur inside the string
         * like \t and \n. We know that all escape sequences are valid because
         * the tokenizer would have already thrown an error otherwise.
         */
        let mut it = text.trim_matches('"').chars();
        while let Some(c) = &it.next() {
            match c {
                '\\' => {
                    // will never be false, just need to grab the character
                    if let Some(nc) = &it.next() {
                        match nc {
                            // read hexadecimals
                            'u' => {
                                let mut hex_sequence = String::with_capacity(4);

                                for _ in 0..4 {
                                    match &it.next() {
                                        Some(hex_digit) => hex_sequence.push(*hex_digit),
                                        _ => panic!("Should never reach here."),
                                    }
                                }

                                let char_code =
                                    u32::from_str_radix(hex_sequence.as_str(), 16).unwrap();

                                // actually safe because we can't have an invalid hex sequence at this point
                                let unicode_char = unsafe { char::from_u32_unchecked(char_code) };
                                value.push_str(format!("{}", unicode_char).as_str());
                            }
                            c => match escaped_chars.get(c) {
                                Some(nc) => value.push(*nc),
                                _ => {}
                            },
                        }
                    }
                }
                c => {
                    value.push(*c);
                }
            }
        }

        return Ok(Node::String(Box::new(ValueNode {
            value,
            loc: token.loc,
        })));
    }

    /// Parses arrays in the format of [value, value].
    fn parse_array(&mut self) -> Result<Node, MomoaError> {
        let start;
        let end;

        match self.must_match(TokenKind::LBracket) {
            Ok(token) => start = token.loc.start,
            Err(error) => return Err(error),
        }

        let mut elements = Vec::<Node>::new();
        let mut comma_dangle = false;

        while let Some(peek_token_result) = self.peek_token() {
            match peek_token_result {
                Ok(token) if token.kind == TokenKind::Comma => {
                    return Err(MomoaError::UnexpectedToken {
                        unexpected: token.kind,
                        line: token.loc.start.line,
                        column: token.loc.start.column,
                    })
                }
                Ok(token) if token.kind == TokenKind::RBracket => {
                    if comma_dangle && !self.options.allow_trailing_commas {
                        return Err(MomoaError::UnexpectedToken {
                            unexpected: token.kind,
                            line: token.loc.start.line,
                            column: token.loc.start.column,
                        });
                    }

                    break;
                }
                Ok(_) => {
                    let value = self.parse_value()?;
                    elements.push(Node::Element(Box::new(ValueNode {
                        loc: self.get_value_loc(&value),
                        value,
                    })));
                }
                Err(error) => return Err(error),
            }

            // only a comma or right bracket is valid here
            comma_dangle = self.maybe_match(TokenKind::Comma).is_some();
            if !comma_dangle && !self.options.allow_trailing_commas {
                break;
            }
        }

        // now there must be a right bracket
        let rbracket = self.must_match(TokenKind::RBracket)?;
        end = rbracket.loc.end;

        return Ok(Node::Array(Box::new(ArrayNode {
            elements,
            loc: LocationRange { start, end },
        })));
    }

    /// Parses objects in teh format of { "key": value, "key": value }.
    fn parse_object(&mut self) -> Result<Node, MomoaError> {
        let start;
        let end;

        let lbrace = self.must_match(TokenKind::LBrace)?;
        start = lbrace.loc.start;

        let mut members = Vec::<Node>::new();
        let mut comma_dangle = false;

        while let Some(peek_token_result) = self.peek_token() {
            match peek_token_result {
                Ok(token) if token.kind == TokenKind::Comma => {
                    return Err(MomoaError::UnexpectedToken {
                        unexpected: token.kind,
                        line: token.loc.start.line,
                        column: token.loc.start.column,
                    })
                }
                Ok(token) if token.kind == TokenKind::RBrace => {
                    if comma_dangle && !self.options.allow_trailing_commas {
                        return Err(MomoaError::UnexpectedToken {
                            unexpected: token.kind,
                            line: token.loc.start.line,
                            column: token.loc.start.column,
                        });
                    }

                    break;
                }
                Ok(_) => {
                    // name: value
                    let name = self.parse_string()?;
                    self.must_match(TokenKind::Colon)?;
                    let value = self.parse_value()?;

                    members.push(Node::Member(Box::new(MemberNode {
                        loc: LocationRange {
                            start: self.get_value_loc(&name).start,
                            end: self.get_value_loc(&value).end,
                        },
                        name,
                        value,
                    })));
                }
                Err(error) => return Err(error),
            }

            // only a comma or right bracket is valid here
            comma_dangle = self.maybe_match(TokenKind::Comma).is_some();
            if !comma_dangle && !self.options.allow_trailing_commas {
                break;
            }
        }

        // now there must be a right bracket
        let rbracket = self.must_match(TokenKind::RBrace)?;
        end = rbracket.loc.end;

        return Ok(Node::Object(Box::new(ObjectNode {
            members,
            loc: LocationRange { start, end },
        })));
    }
}

pub fn parse(text: &str, mode: Mode, options: Option<ParserOptions>) -> Result<Node, MomoaError> {
    let mut parser = Parser::new(text, mode, options);
    parser.parse()
}
