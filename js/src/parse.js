/**
 * @fileoverview JSON parser
 * @author Nicholas C. Zakas
 */


//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { tokenize } from "./tokens.js";
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

    const tokens = tokenize(text, {
        mode: options.mode,
        ranges: options.ranges
    });

    let tokenIndex = 0;
    const json5 = options.mode === "json5";

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
    const next = options.mode === "json" ? nextNoComments : nextSkipComments;

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
     * Asserts a token has one of the given types.
     * @param {Token} token The token to check.
     * @param {string[]} types The token types.
     * @returns {void}
     * @throws {UnexpectedToken} If the token type isn't expected.
     */ 
    function assertTokenTypes(token, types) {
        if (!token || !types.includes(token.type)) {
            throw new UnexpectedToken(token);
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
     * @param {Token} token The token representing the literal. 
     * @returns {StringNode|NumberNode|BooleanNode} The node representing
     *      the value.
     */
    function createLiteralNode(token) {
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


    function parseProperty(token) {

        if (json5) {
            assertTokenTypes(token, ["String", "Identifier", "Number"]);
        } else {
            assertTokenType(token, "String");
        }

        // TODO: Clean this up a bit
        let key = token.type === "String"
            ? /** @type {StringNode} */ (createLiteralNode(token))
            : /** @type {IdentifierNode|NaNNode|InfinityNode} */ (createJSON5IdentifierNode(token));

        // in JSON5, need to check for NaN and Infinity and create identifier nodes
        if (json5 && (key.type === "NaN" || key.type === "Infinity")) {

            // NaN and Infinity cannot be signed and be a property key
            if (key.sign !== "") {
                throw new UnexpectedToken(token);
            }

            key = t.identifier(key.type, { loc: key.loc, ...createRange(key.loc.start, key.loc.end) });
        }

        token = next();
        assertTokenType(token, "Colon");
        const value = parseValue();
        const range = createRange(key.loc.start, value.loc.end);

        return t.member(/** @type {StringNode|IdentifierNode} */ (key), value, {
            loc: {
                start: {
                    ...key.loc.start
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

                if (!token) {
                    throw new UnexpectedEOF(members[members.length-1].loc.end);
                }
    
                if (token.type === "Comma") {
                    token = next();

                    /*
                      * JSON5: Trailing commas are allowed in arrays.
                      * So we need to check if the token is a comma,
                      * and if so, then we need to check if the next
                      * token is a RBracket. If it is, then we need to
                      * break out of the loop.
                      */
                    if (json5 && token.type === "RBrace") {
                        break;
                    }                      
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

                    /*
                      * JSON5: Trailing commas are allowed in arrays.
                      * So we need to check if the token is a comma,
                      * and if so, then we need to check if the next
                      * token is a RBracket. If it is, then we need to
                      * break out of the loop.
                      */
                    if (json5 && token.type === "RBracket") {
                        break;
                    }                    
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
                return createLiteralNode(token);

            case "Number":
                if (json5) {
                    let tokenText = text.slice(token.loc.start.offset, token.loc.end.offset);
                    if (tokenText[0] === "+" || tokenText[0] === "-") {
                        tokenText = tokenText.slice(1);
                    }

                    if (tokenText === "NaN" || tokenText === "Infinity") {
                        return createJSON5IdentifierNode(token);
                    }
                }
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
