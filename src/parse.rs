use crate::Mode;
use crate::location::*;
use crate::ast::*;
use crate::tokens::*;
use crate::errors::MomoaError;
use std::iter::Peekable;
use std::collections::HashMap;

//-----------------------------------------------------------------------------
// Parser
//-----------------------------------------------------------------------------

struct Parser<'a> {
    text: &'a str,
    it: Peekable<Tokens<'a>>,
    loc: Location,
    tokens: Vec<Token>,
}

impl<'a> Parser<'a> {

    pub fn new(text: &'a str, mode: Mode) -> Self {
        Parser {
            text,
            it: Tokens::new(text, mode).peekable(),
            tokens: Vec::new(),
            loc: Location {
                line: 1,
                column: 1,
                offset: 0
            }
        }
    }

    pub fn parse(&mut self) -> Result<Node, MomoaError> {
        let body = self.parse_value()?;

        let loc = match &body {
            Node::Array(array) => array.loc,
            Node::Boolean(b) => b.loc,
            Node::String(s) => s.loc,
            Node::Number(n) => n.loc,
            Node::Null(n) => n.loc,
            Node::Object(o) => o.loc,
            _ => return Err(MomoaError::UnexpectedElement { loc: self.loc })
        };

        Ok(Node::Document(Box::new(DocumentNode {
            body,
            loc,
            tokens: self.tokens.clone()
        })))
    }

    fn parse_value(&mut self) -> Result<Node, MomoaError> {

        // while loop instead of if because we need to account for comments
        while let Some(token_result) = self.it.peek() {
            
            match token_result {
                Ok(token) => {
                    match token.kind {

                        /*
                         * JSON vs. JSONC: Only the JSONC tokenization will return
                         * a comment. The JSON tokenization throws an error if it
                         * finds a comment, so it's safe to not verify if comments
                         * are allowed here.
                          */
                        TokenKind::LineComment | TokenKind::BlockComment => {
                            self.it.next();
                            continue;
                        },
                        TokenKind::Boolean => return self.parse_boolean(),
                        TokenKind::Number => return self.parse_number(),
                        TokenKind::Null => return self.parse_null(),
                        TokenKind::String => return self.parse_string(),
                        _ => panic!("Not implemented")
                    }
                },
                Err(error) => return Err(*error)
            }
        }

        // otherwise we've hit an unexpected end of input
        Err(MomoaError::UnexpectedEndOfInput {
            loc: self.loc
        })

    }

    // fn maybe_match(&mut self, kind: TokenKind) -> Option<Result<Token, MomoaError>> {

    //     // check to see if there's another result coming from the iterator
    //     if let Some(next_token_result) = self.it.peek() {

    //         let next_token = next_token_result.as_ref().unwrap();
    
    //         if next_token.kind == kind {
    //             &self.it.next();
    //             self.loc = next_token.loc.start;
    //             self.tokens.push(*next_token);
    
    //             return Some(Ok(*next_token));
    //         }
    //     }

    //     // otherwise we didn't match anything
    //     None
    // }

    fn must_match(&mut self, kind: TokenKind) -> Result<Token, MomoaError> {
        
        // check if there is a token first
        if let Some(next_token_result) = self.it.next() {

            let next_token = next_token_result.unwrap();

            if next_token.kind == kind {
                self.loc = next_token.loc.start;
                self.tokens.push(next_token);

                return Ok(next_token);
            }

            return Err(MomoaError::UnexpectedToken {
                unexpected: next_token.kind,
                loc: next_token.loc.start
            })

        }

        Err(MomoaError::UnexpectedEndOfInput {
            loc: self.loc
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
            loc: token.loc
        })));
    }

    fn parse_number(&mut self) -> Result<Node, MomoaError> {

        let token = self.must_match(TokenKind::Number)?;
        let text = self.get_text(token.loc.start.offset, token.loc.end.offset);
        let value = text.parse::<f64>().unwrap();

        return Ok(Node::Number(Box::new(ValueNode {
            value,
            loc: token.loc
        })));
    }

    fn parse_null(&mut self) -> Result<Node, MomoaError> {

        let token = self.must_match(TokenKind::Null)?;

        return Ok(Node::Null(Box::new(NullNode {
            loc: token.loc
        })));
    }

    fn parse_string(&mut self) -> Result<Node, MomoaError> {

        let token = self.must_match(TokenKind::String)?;
        let text = self.get_text(token.loc.start.offset, token.loc.end.offset);

        // TODO: Find a way to move this elsewhere
        // for easier lookup of token kinds for characters
        let escaped_chars: HashMap<&char,char> = HashMap::from([
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
                                        _ => panic!("Should never reach here.")
                                    }
                                }

                                let char_code = u32::from_str_radix(hex_sequence.as_str(), 16).unwrap();
                                
                                // actually safe because we can't have an invalid hex sequence at this point
                                let unicode_char = unsafe {
                                    char::from_u32_unchecked(char_code)
                                };
                                value.push_str(format!("{}", unicode_char).as_str());
                            }
                            c => {
                                match escaped_chars.get(c) {
                                    Some(nc) => value.push(*nc),
                                    _ => {}
                                }
                            }
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
            loc: token.loc
        })));
    }

}

pub fn parse(text: &str, mode: Mode) -> Result<Node, MomoaError> {
    let mut parser = Parser::new(text, mode);
    parser.parse()
}
