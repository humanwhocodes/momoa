/**
 * @fileoverview JSON parser
 * @author Nicholas C. Zakas
 */


//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { Tokenizer, tt } from "./tokens.js";
import { types as t } from "./types.js";
import { escapeToChar, json5EscapeToChar, json5LineTerminators } from "./syntax.js";
import { UnexpectedToken, ErrorWithLocation, UnexpectedEOF } from "./errors.js";

//-----------------------------------------------------------------------------
// Typedefs
//-----------------------------------------------------------------------------

/** @typedef {import("./typedefs.ts").Location} Location */
/** @typedef {import("./typedefs.ts").Token} Token */
/** @typedef {import("./typedefs.ts").TokenType} TokenType */
/** @typedef {import("./typedefs.ts").Node} Node */
/** @typedef {import("./typedefs.ts").Mode} Mode */
/** @typedef {import("./typedefs.ts").ParseOptions} ParseOptions */
/** @typedef {import("./typedefs.ts").DocumentNode} DocumentNode */
/** @typedef {import("./typedefs.ts").StringNode} StringNode */
/** @typedef {import("./typedefs.ts").NumberNode} NumberNode */
/** @typedef {import("./typedefs.ts").BooleanNode} BooleanNode */
/** @typedef {import("./typedefs.ts").MemberNode} MemberNode */
/** @typedef {import("./typedefs.ts").ObjectNode} ObjectNode */
/** @typedef {import("./typedefs.ts").ElementNode} ElementNode */
/** @typedef {import("./typedefs.ts").ArrayNode} ArrayNode */
/** @typedef {import("./typedefs.ts").NullNode} NullNode */
/** @typedef {import("./typedefs.ts").IdentifierNode} IdentifierNode */
/** @typedef {import("./typedefs.ts").NaNNode} NaNNode */
/** @typedef {import("./typedefs.ts").InfinityNode} InfinityNode */
/** @typedef {import("./typedefs.ts").Sign} Sign */
/** @typedef {import("./typedefs.ts").ValueNode} ValueNode */

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/** @type {ParseOptions} */
const DEFAULT_OPTIONS = {
    mode: "json",
    ranges: false,
    tokens: false,
    allowTrailingCommas: false
};

/**
 * Converts a JSON-encoded string into a JavaScript string, interpreting each
 * escape sequence.
 * @param {string} value The text for the token.
 * @param {Token} token The string token to convert into a JavaScript string.
 * @param {boolean} json5 `true` if parsing JSON5, `false` otherwise.
 * @returns {string} A JavaScript string.
 */
function getStringValue(value, token, json5 = false) {
    
    let result = "";
    let escapeIndex = value.indexOf("\\");
    let lastIndex = 0;

    // While there are escapes, interpret them to build up the result
    while (escapeIndex >= 0) {

        // append the text that happened before the escape
        result += value.slice(lastIndex, escapeIndex);

        // get the character immediately after the \
        const escapeChar = value.charAt(escapeIndex + 1);
        const escapeCharCode = escapeChar.charCodeAt(0);
        
        // check for the non-Unicode escape sequences first
        if (json5 && json5EscapeToChar.has(escapeCharCode)) {
            result += json5EscapeToChar.get(escapeCharCode);
            lastIndex = escapeIndex + 2;
        } else if (escapeToChar.has(escapeCharCode)) {
            result += escapeToChar.get(escapeCharCode);
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
        } else if (json5 && escapeChar === "x") {
            const hexCode = value.slice(escapeIndex + 2, escapeIndex + 4);
            if (hexCode.length < 2 || /[^0-9a-f]/i.test(hexCode)) {
                throw new ErrorWithLocation(
                    `Invalid hex escape \\x${ hexCode}.`,
                    {
                        line: token.loc.start.line,
                        column: token.loc.start.column + escapeIndex,
                        offset: token.loc.start.offset + escapeIndex
                    }
                );
            }

            result += String.fromCharCode(parseInt(hexCode, 16));
            lastIndex = escapeIndex + 4;
        } else if (json5 && json5LineTerminators.has(escapeCharCode)) {
            lastIndex = escapeIndex + 2;

            // we also need to skip \n after a \r
            if (escapeChar === "\r" && value.charAt(lastIndex) === "\n") {
                lastIndex++;
            }
            
        } else {
            // all characters can be escaped in JSON5
            if (json5) {
                result += escapeChar;
                lastIndex = escapeIndex + 2;
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
 * @param {boolean} json5 `true` if parsing JSON5, `false` otherwise.
 * @returns {string|boolean|number} A number, string, or boolean.
 * @throws {TypeError} If an unknown token type is found. 
 */
function getLiteralValue(value, token, json5 = false) {
    switch (token.type) {
        case "Boolean":
            return value === "true";
            
        case "Number":
            return Number(value);

        case "String":
            return getStringValue(value.slice(1, -1), token, json5);

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

    const tokens = [];
    const tokenizer = new Tokenizer(text, {
        mode: options.mode,
        ranges: options.ranges
    });

    const json5 = options.mode === "json5";
    const allowTrailingCommas = options.allowTrailingCommas || json5;

    /**
     * Returns the next token knowing there are no comments.
     * @returns {number} The next token type or 0 if no next token.
     */
    function nextNoComments() {
        const nextType = tokenizer.next();

        if (nextType && options.tokens) {
            tokens.push(tokenizer.token);
        }
        return nextType;
    }
    
    /**
     * Returns the next token knowing there are comments to skip.
     * @returns {number} The next token type or 0 if no next token.
     */
    function nextSkipComments() {
        const nextType = tokenizer.next();
        if (nextType && options.tokens) {
            tokens.push(tokenizer.token);
        }

        if (nextType >= tt.LineComment) {
            return nextSkipComments();
        }

        return nextType;

    }

    // determine correct way to evaluate tokens based on presence of comments
    const next = options.mode === "json" ? nextNoComments : nextSkipComments;

    /**
     * Asserts a token has the given type.
     * @param {number} token The token to check.
     * @param {number} type The token type.
     * @throws {UnexpectedToken} If the token type isn't expected.
     * @returns {void}
     */
    function assertTokenType(token, type) {
        if (token !== type) {
            throw new UnexpectedToken(tokenizer.token);
        }
    }

    /**
     * Asserts a token has one of the given types.
     * @param {number} token The token to check.
     * @param {number[]} types The token types.
     * @returns {void}
     * @throws {UnexpectedToken} If the token type isn't expected.
     */ 
    function assertTokenTypes(token, types) {
        if (!types.includes(token)) {
            throw new UnexpectedToken(tokenizer.token);
        }
    }

    /**
     * Creates a range only if ranges are specified.
     * @param {Location} start The start offset for the range.
     * @param {Location} end The end offset for the range.
     * @returns {{range:[number,number]}|undefined} An object with a 
     */
    function createRange(start, end) {
        // @ts-ignore tsc incorrect - options might be undefined
        return options.ranges ? {
            range: [start.offset, end.offset]
        } : undefined;
    }

    /**
     * Creates a node for a string, boolean, or number.
     * @param {number} tokenType The token representing the literal. 
     * @returns {StringNode|NumberNode|BooleanNode} The node representing
     *      the value.
     */
    function createLiteralNode(tokenType) {
        const token = tokenizer.token;
        const range = createRange(token.loc.start, token.loc.end);
        const value = getLiteralValue(
            text.slice(token.loc.start.offset, token.loc.end.offset),
            token,
            json5
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

        switch (tokenType) {
            case tt.String:
                return t.string(/** @type {string} */ (value), parts);

            case tt.Number:
                return t.number(/** @type {number} */ (value), parts);
                
            case tt.Boolean:
                return t.boolean(/** @type {boolean} */ (value), parts);

            default:
                throw new TypeError(`Unknown token type ${token.type}.`);
        }
    }

    /**
     * Creates a node for a JSON5 identifier.
     * @param {Token} token The token representing the identifer. 
     * @returns {NaNNode|InfinityNode|IdentifierNode} The node representing
     *      the value.
     */
    function createJSON5IdentifierNode(token) {
        const range = createRange(token.loc.start, token.loc.end);
        const identifier = text.slice(token.loc.start.offset, token.loc.end.offset);
        const loc = {
            start: {
                ...token.loc.start
            },
            end: {
                ...token.loc.end
            }
        };
        const parts = { loc, ...range };

        // Check for NaN or Infinity
        if (token.type !== "Identifier") {

            let sign = "";

            // check if the first character in the token is a plus or minus
            if (identifier[0] === "+" || identifier[0] === "-") {
                sign = identifier[0];
            }

            // check if the token is NaN or Infinity
            return t[identifier.includes("NaN") ? "nan" : "infinity"](/** @type {Sign} */ (sign), parts);
        }

        return t.identifier(identifier, parts);
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


    /**
     * Parses a property in an object.
     * @param {number} tokenType The token representing the property.
     * @returns {MemberNode} The node representing the property.
     * @throws {UnexpectedToken} When an unexpected token is found.
     * @throws {UnexpectedEOF} When the end of the file is reached.
     */
    function parseProperty(tokenType) {

        if (json5) {
            assertTokenTypes(tokenType, [tt.String, tt.Identifier, tt.Number]);
        } else {
            assertTokenType(tokenType, tt.String);
        }

        const token = tokenizer.token;

        // TODO: Clean this up a bit
        let key = tokenType === tt.String
            ? /** @type {StringNode} */ (createLiteralNode(tokenType))
            : /** @type {IdentifierNode|NaNNode|InfinityNode} */ (createJSON5IdentifierNode(token));

        // in JSON5, need to check for NaN and Infinity and create identifier nodes
        if (json5 && (key.type === "NaN" || key.type === "Infinity")) {

            // NaN and Infinity cannot be signed and be a property key
            if (key.sign !== "") {
                throw new UnexpectedToken(tokenizer.token);
            }

            key = t.identifier(key.type, { loc: key.loc, ...createRange(key.loc.start, key.loc.end) });
        }

        tokenType = next();
        assertTokenType(tokenType, tt.Colon);
        const value = parseValue();
        const range = createRange(key.loc.start, value.loc.end);

        return t.member(
            /** @type {StringNode|IdentifierNode} */ (key),
            /** @type {ValueNode} */ (value),
            {
                loc: {
                    start: {
                        ...key.loc.start
                    },
                    end: {
                        ...value.loc.end
                    }
                },
                ...range
            }
        );
    }

    /**
     * Parses an object literal.
     * @param {number} firstTokenType The first token type in the object.
     * @returns {ObjectNode} The object node.
     * @throws {UnexpectedEOF} When the end of the file is reached.
     * @throws {UnexpectedToken} When an unexpected token is found.
     */
    function parseObject(firstTokenType) {

        // The first token must be a { or else it's an error
        assertTokenType(firstTokenType, tt.LBrace);

        const firstToken = tokenizer.token;
        const members = [];
        let tokenType = next();

        if (tokenType !== tt.RBrace) {
            do {
    
                // add the value into the array
                members.push(parseProperty(tokenType));
    
                tokenType = next();

                if (!tokenType) {
                    throw new UnexpectedEOF(members[members.length-1].loc.end);
                }
    
                if (tokenType === tt.Comma) {
                    tokenType = next();

                    /*
                      * Trailing commas.
                      * So we need to check if the token is a comma,
                      * and if so, then we need to check if the next
                      * token is a RBrace. If it is, then we need to
                      * break out of the loop.
                      */
                    if (allowTrailingCommas && tokenType === tt.RBrace) {
                        break;
                    }                      
                } else {
                    break;
                }
            } while (tokenType);
        }

        assertTokenType(tokenType, tt.RBrace);
        const lastToken = tokenizer.token;
        const range = createRange(firstToken.loc.start, lastToken.loc.end);

        return t.object(members, {
            loc: {
                start: {
                    ...firstToken.loc.start
                },
                end: {
                    ...lastToken.loc.end
                }
            },
            ...range
        });

    }

    /**
     * Parses an array literal.
     * @param {number} firstTokenType The first token in the array.
     * @returns {ArrayNode} The array node.
     * @throws {UnexpectedToken} When an unexpected token is found.
     * @throws {UnexpectedEOF} When the end of the file is reached.
     */
    function parseArray(firstTokenType) {

        // The first token must be a [ or else it's an error
        assertTokenType(firstTokenType, tt.LBracket);

        const firstToken = tokenizer.token;
        const elements = [];
        let tokenType = next();
        
        if (tokenType !== tt.RBracket) {

            do {

                // add the value into the array
                const value = parseValue(tokenType);

                elements.push(t.element(
                    /** @type {ValueNode} */ (value),
                    { loc: value.loc }
                ));

                tokenType = next();
              
                if (tokenType === tt.Comma) {
                    tokenType = next();

                    /*
                      * Trailing commas.
                      * So we need to check if the token is a comma,
                      * and if so, then we need to check if the next
                      * token is a RBracket. If it is, then we need to
                      * break out of the loop.
                      */
                    if (allowTrailingCommas && tokenType === tt.RBracket) {
                        break;
                    }                    
                } else {
                    break;
                }
            } while (tokenType);
        }

        assertTokenType(tokenType, tt.RBracket);

        const lastToken = tokenizer.token;
        const range = createRange(firstToken.loc.start, lastToken.loc.end);

        return t.array(elements, {
            loc: {
                start: {
                    ...firstToken.loc.start
                },
                end: {
                    ...lastToken.loc.end
                }
            },
            ...range
        });

    }

    /**
     * Parses a JSON value.
     * @param {number} [tokenType] The token type to parse.
     * @returns {ValueNode|IdentifierNode} The node representing the value.
     */
    function parseValue(tokenType) {

        tokenType = tokenType ?? next();
        const token = tokenizer.token;
        
        switch (tokenType) {
            case tt.String:
            case tt.Boolean:
                return createLiteralNode(tokenType);

            case tt.Number:
                if (json5) {
                    let tokenText = text.slice(token.loc.start.offset, token.loc.end.offset);
                    if (tokenText[0] === "+" || tokenText[0] === "-") {
                        tokenText = tokenText.slice(1);
                    }

                    if (tokenText === "NaN" || tokenText === "Infinity") {
                        return createJSON5IdentifierNode(token);
                    }
                }
                return createLiteralNode(tokenType);

            case tt.Null:
                return createNullNode(token);

            case tt.LBrace:
                return parseObject(tokenType);

            case tt.LBracket:
                return parseArray(tokenType);

            default:
                throw new UnexpectedToken(token);
        }

    }

    
    const docBody = parseValue();
    
    const unexpectedToken = next();
    if (unexpectedToken) {
        throw new UnexpectedToken(tokenizer.token);
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

    return t.document(/** @type {ValueNode} */ (docBody), docParts);
}
