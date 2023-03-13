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

/** @typedef {import("./momoa").Location} Location */
/** @typedef {import("./momoa").Token} Token */
/** @typedef {import("./momoa").TokenType} TokenType */
/** @typedef {import("./momoa").Node} Node */
/** @typedef {import("./momoa").Mode} Mode */
/** @typedef {import("./momoa").ParseOptions} ParseOptions */
/** @typedef {import("./momoa").DocumentNode} DocumentNode */
/** @typedef {import("./momoa").StringNode} StringNode */
/** @typedef {import("./momoa").NumberNode} NumberNode */
/** @typedef {import("./momoa").BooleanNode} BooleanNode */
/** @typedef {import("./momoa").MemberNode} MemberNode */
/** @typedef {import("./momoa").ObjectNode} ObjectNode */
/** @typedef {import("./momoa").ElementNode} ElementNode */
/** @typedef {import("./momoa").ArrayNode} ArrayNode */
/** @typedef {import("./momoa").NullNode} NullNode */

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/** @type {ParseOptions} */
const DEFAULT_OPTIONS = {
    mode: "json",
    ranges: false,
    tokens: false
};

/**
 * Converts a JSON-encoded string into a JavaScript string, interpreting each
 * escape sequence.
 * @param {string} value The text for the token.
 * @param {Token} token The string token to convert into a JavaScript string.
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
 * @param {Token} token The JSON token to get a value for.
 * @returns {string|boolean|number} A number, string, or boolean.
 * @throws {TypeError} If an unknown token type is found. 
 */
function getLiteralValue(value, token) {
    switch (token.type) {
        case "Boolean":
            return value === "true";
            
        case "Number":
            return Number(value);

        case "String":
            return getStringValue(value.slice(1, -1), token);

        default:
            throw new TypeError(`Unknown token type "${token.type}.`);
    }
}

//-----------------------------------------------------------------------------
// Main Function
//-----------------------------------------------------------------------------

/**
 * 
 * @param {string} text The text to parse.
 * @param {ParseOptions} [options] The options object.
 * @returns {DocumentNode} The AST representing the parsed JSON.
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

    /**
     * Returns the next token knowing there are no comments.
     * @returns {Token|undefined} The next or undefined if no next token.
     */
    function nextNoComments() {
        return tokens[tokenIndex++];
    }
    
    /**
     * Returns the next token knowing there are comments to skip.
     * @returns {Token|undefined} The next or undefined if no next token.
     */
    function nextSkipComments() {
        const nextToken = tokens[tokenIndex++];
        if (nextToken && nextToken.type.endsWith("Comment")) {
            return nextSkipComments();
        }

        return nextToken;

    }

    // determine correct way to evaluate tokens based on presence of comments
    const next = options.mode === "jsonc" ? nextSkipComments : nextNoComments;

    /**
     * Asserts a token has the given type.
     * @param {Token} token The token to check.
     * @param {string} type The token type.
     * @throws {UnexpectedToken} If the token type isn't expected.
     * @returns {void}
     */
    function assertTokenType(token, type) {
        if (!token || token.type !== type) {
            throw new UnexpectedToken(token);
        }
    }

    /**
     * Creates a range only if ranges are specified.
     * @param {Location} start The start offset for the range.
     * @param {Location} end The end offset for the range.
     * @returns {{range:number[]}|undefined} An object with a 
     */
    function createRange(start, end) {
        // @ts-ignore tsc incorrect - options might be undefined
        return options.ranges ? {
            range: [start.offset, end.offset]
        } : undefined;
    }

    /**
     * Creates a node for a string, boolean, or number.
     * @param {Token} token The token representing the literal. 
     * @returns {StringNode|NumberNode|BooleanNode} The node representing
     *      the value.
     */
    function createLiteralNode(token) {
        const range = createRange(token.loc.start, token.loc.end);
        const value = getLiteralValue(
            text.slice(token.loc.start.offset, token.loc.end.offset),
            token
        );
        const loc = {
            start: {
                ...token.loc.start
            },
            end: {
                ...token.loc.end
            }
        };
        const parts = { loc, ...range };

        switch (token.type) {
            case "String":
                return t.string(/** @type {string} */ (value), parts);

            case "Number":
                return t.number(/** @type {number} */ (value), parts);
                
            case "Boolean":
                return t.boolean(/** @type {boolean} */ (value), parts);

            default:
                throw new TypeError(`Unknown token type ${token.type}.`);
        }
    }

    /**
     * Creates a node for a null.
     * @param {Token} token The token representing null. 
     * @returns {NullNode} The node representing null.
     */
    function createNullNode(token) {
        const range = createRange(token.loc.start, token.loc.end);

        return t.null({
            loc: {
                start: {
                    ...token.loc.start
                },
                end: {
                    ...token.loc.end
                }
            },
            ...range
        });
    }


    function parseProperty(token) {
        assertTokenType(token, "String");
        const name = createLiteralNode(token);

        token = next();
        assertTokenType(token, "Colon");
        const value = parseValue();
        const range = createRange(name.loc.start, value.loc.end);

        return t.member(/** @type {StringNode} */ (name), value, {
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
