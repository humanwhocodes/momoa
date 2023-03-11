/**
 * @fileoverview JSON parser
 * @author Nicholas C. Zakas
 */


//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { tokenize } from "./tokens.js";
import { types as t } from "./types.js";
import { escapeToChar } from "./syntax.js";
import { UnexpectedToken, ErrorWithLocation } from "./errors.js";

//-----------------------------------------------------------------------------
// Typedefs
//-----------------------------------------------------------------------------

/** @typedef {import("./momoa").MomoaLocation} MomoaLocation */
/** @typedef {import("./momoa").MomoaToken} MomoaToken */
/** @typedef {import("./momoa").MomoaNode} MomoaNode */
/** @typedef {import("./momoa").MomoaDocumentNode} MomoaDocumentNode */
/** @typedef {import("./momoa").MomoaMode} MomoaMode */
/** @typedef {import("./momoa").MomoaParseOptions} MomoaParseOptions */

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/** @type {MomoaParseOptions} */
const DEFAULT_OPTIONS = {
    mode: "json",
    ranges: false,
    tokens: false
};

/**
 * Converts a JSON-encoded string into a JavaScript string, interpreting each
 * escape sequence.
 * @param {string} value The text for the token.
 * @param {MomoaToken} token The string token to convert into a JavaScript string.
 * @returns {string} A JavaScript string.
 */
function getStringValue(value, token) {
    
    let result = "";
    let escapeIndex = value.indexOf("\\");
    let lastIndex = 0;

    // While there are escapes, interpret them to build up the result
    while (escapeIndex >= 0) {

        // append the text that happened before the escape
        result += value.slice(lastIndex, escapeIndex);

        // get the character immediately after the \
        const escapeChar = value.charAt(escapeIndex + 1);
        
        // check for the non-Unicode escape sequences first
        if (escapeToChar.has(escapeChar)) {
            result += escapeToChar.get(escapeChar);
            lastIndex = escapeIndex + 2;
        } else if (escapeChar === "u") {
            const hexCode = value.slice(escapeIndex + 2, escapeIndex + 6);
            if (hexCode.length < 4 || /[^0-9a-f]/i.test(hexCode)) {
                throw new ErrorWithLocation(
                    `Invalid unicode escape \\u${ hexCode}.`,
                    {
                        line: token.loc.start.line,
                        column: token.loc.start.column + escapeIndex,
                        offset: token.loc.start.offset + escapeIndex
                    }
                );
            }
            
            result += String.fromCharCode(parseInt(hexCode, 16));
            lastIndex = escapeIndex + 6;
        } else {
            throw new ErrorWithLocation(
                `Invalid escape \\${ escapeChar }.`,
                {
                    line: token.loc.start.line,
                    column: token.loc.start.column + escapeIndex,
                    offset: token.loc.start.offset + escapeIndex
                }
            );
        }

        // find the next escape sequence
        escapeIndex = value.indexOf("\\", lastIndex);
    }

    // get the last segment of the string value
    result += value.slice(lastIndex);

    return result;
}

/**
 * Gets the JavaScript value represented by a JSON token.
 * @param {string} value The text value of the token.
 * @param {MomoaToken} token The JSON token to get a value for.
 * @returns {*} A number, string, boolean, or `null`. 
 */
function getLiteralValue(value, token) {
    switch (token.type) {
    case "Boolean":
        return value === "true";
        
    case "Number":
        return Number(value);

    case "Null":
        return null;

    case "String":
        return getStringValue(value.slice(1, -1), token);
    }
}

//-----------------------------------------------------------------------------
// Main Function
//-----------------------------------------------------------------------------

/**
 * 
 * @param {string} text The text to parse.
 * @param {MomoaParseOptions} [options] The options object.
 * @returns {MomoaDocumentNode} The AST representing the parsed JSON.
 * @throws {Error} When there is a parsing error. 
 */
export function parse(text, options) {

    options = Object.freeze({
        ...DEFAULT_OPTIONS,
        ...options
    });

    const tokens = tokenize(text, {
        mode: options.mode,
        ranges: options.ranges
    });

    let tokenIndex = 0;

    function nextNoComments() {
        return tokens[tokenIndex++];
    }
    
    function nextSkipComments() {
        const nextToken = tokens[tokenIndex++];
        if (nextToken && nextToken.type.endsWith("Comment")) {
            return nextSkipComments();
        }

        return nextToken;

    }

    // determine correct way to evaluate tokens based on presence of comments
    const next = options.mode === "jsonc" ? nextSkipComments : nextNoComments;

    function assertTokenType(token, type) {
        if (!token || token.type !== type) {
            throw new UnexpectedToken(token);
        }
    }

    function createRange(start, end) {
        return options.ranges ? {
            range: [start.offset, end.offset]
        } : undefined;
    }

    function createLiteralNode(token) {
        const range = createRange(token.loc.start, token.loc.end);

        return {
            type: token.type,
            value: getLiteralValue(
                text.slice(token.loc.start.offset, token.loc.end.offset),
                token
            ),
            loc: {
                start: {
                    ...token.loc.start
                },
                end: {
                    ...token.loc.end
                }
            },
            ...range
        };
    }

    function createNullNode(token) {
        const range = createRange(token.loc.start, token.loc.end);

        return {
            type: token.type,
            loc: {
                start: {
                    ...token.loc.start
                },
                end: {
                    ...token.loc.end
                }
            },
            ...range
        };
    }


    function parseProperty(token) {
        assertTokenType(token, "String");
        const name = createLiteralNode(token);

        token = next();
        assertTokenType(token, "Colon");
        const value = parseValue();
        const range = createRange(name.loc.start, value.loc.end);

        return t.member(name, value, {
            loc: {
                start: {
                    ...name.loc.start
                },
                end: {
                    ...value.loc.end
                }
            },
            ...range
        });
    }

    function parseObject(firstToken) {

        // The first token must be a { or else it's an error
        assertTokenType(firstToken, "LBrace");

        const members = [];
        let token = next();

        if (token && token.type !== "RBrace") {
            do {
    
                // add the value into the array
                members.push(parseProperty(token));
    
                token = next();
    
                if (token.type === "Comma") {
                    token = next();
                } else {
                    break;
                }
            } while (token);
        }

        assertTokenType(token, "RBrace");
        const range = createRange(firstToken.loc.start, token.loc.end);

        return t.object(members, {
            loc: {
                start: {
                    ...firstToken.loc.start
                },
                end: {
                    ...token.loc.end
                }
            },
            ...range
        });

    }

    function parseArray(firstToken) {

        // The first token must be a [ or else it's an error
        assertTokenType(firstToken, "LBracket");

        const elements = [];
        let token = next();
        
        if (token && token.type !== "RBracket") {

            do {

              // add the value into the array
              const value = parseValue(token);

              elements.push(t.element(
                value,
                { loc: value.loc }
              ));

              token = next();
              
              if (token.type === "Comma") {
                  token = next();
              } else {
                  break;
              }
            } while (token);
        }

        assertTokenType(token, "RBracket");

        const range = createRange(firstToken.loc.start, token.loc.end);

        return t.array(elements, {
            loc: {
                start: {
                    ...firstToken.loc.start
                },
                end: {
                    ...token.loc.end
                }
            },
            ...range
        });

    }

    function parseValue(token) {

        token = token || next();
        
        switch (token.type) {
        case "String":
        case "Boolean":
        case "Number":
            return createLiteralNode(token);

        case "Null":
            return createNullNode(token);

        case "LBrace":
            return parseObject(token);

        case "LBracket":
            return parseArray(token);

        default:
            throw new UnexpectedToken(token);
        }

    }

    
    const docBody = parseValue();
    
    const unexpectedToken = next();
    if (unexpectedToken) {
        throw new UnexpectedToken(unexpectedToken);
    }
    
    
    const docParts = {
        loc: {
            start: {
                line: 1,
                column: 1,
                offset: 0
            },
            end: {
                ...docBody.loc.end
            }
        }
    };
    
    if (options.tokens) {
        docParts.tokens = tokens;
    }

    if (options.ranges) {
        docParts.range = [
            docParts.loc.start.offset,
            docParts.loc.end.offset
        ];
    }

    return t.document(docBody, docParts);

}
