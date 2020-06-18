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
// Helpers
//-----------------------------------------------------------------------------

/**
 * Converts a JSON-encoded string into a JavaScript string, interpreting each
 * escape sequence.
 * @param {Token} token The string token to convert into a JavaScript string.
 * @returns {string} A JavaScript string.
 */
function getStringValue(token) {
    
    // slice off the quotation marks
    let value = token.value.slice(1, -1);
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
                        index: token.loc.start.index + escapeIndex
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
                    index: token.loc.start.index + escapeIndex
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
 * @param {Token} token The JSON token to get a value for.
 * @returns {*} A number, string, boolean, or `null`. 
 */
function getLiteralValue(token) {
    switch (token.type) {
    case "Boolean":
        return token.value === "true";
        
    case "Number":
        return Number(token.value);

    case "Null":
        return null;

    case "String":
        return getStringValue(token);
    }
}

function createLiteralNode(token) {
    return {
        type: token.type,
        value: getLiteralValue(token),
        loc: {
            start: {
                ...token.loc.start
            },
            end: {
                ...token.loc.end
            }
        }
    };
}

//-----------------------------------------------------------------------------
// Main Function
//-----------------------------------------------------------------------------

/**
 * 
 * @param {string} text The text to parse.
 * @param {boolean} [options.tokens=false] Determines if tokens are returned in
 *      the AST. 
 * @param {boolean} [options.comments=false] Determines if comments are allowed
 *      in the JSON.
 * @returns {Object} The AST representing the parsed JSON.
 * @throws {Error} When there is a parsing error. 
 */
export function parse(text, options = { tokens:false, comments:false }) {

    const tokens = tokenize(text, { comments: !!options.comments });
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
    const next = options.comments ? nextSkipComments : nextNoComments;

    function assertTokenValue(token, value) {
        if (!token || token.value !== value) {
            throw new UnexpectedToken(token);
        }
    }

    function assertTokenType(token, type) {
        if (!token || token.type !== type) {
            throw new UnexpectedToken(token);
        }
    }

    function parseProperty(token) {
        assertTokenType(token, "String");
        const name = createLiteralNode(token);

        token = next();
        assertTokenValue(token, ":");
        const value = parseValue();

        return t.member(name, value, {
            loc: {
                start: {
                    ...name.loc.start
                },
                end: {
                    ...value.loc.end
                }
            }
        });
    }

    function parseObject(firstToken) {

        // The first token must be a { or else it's an error
        assertTokenValue(firstToken, "{");

        const members = [];
        let token = next();

        while (token && token.value !== "}") {

            // add the value into the array
            members.push(parseProperty(token));

            token = next();

            if (token.value === ",") {
                token = next();
            } else {
                break;
            }
        }

        assertTokenValue(token, "}");

        return t.object(members, {
            loc: {
                start: {
                    ...firstToken.loc.start
                },
                end: {
                    ...token.loc.end
                }
            }
        });

    }

    function parseArray(firstToken) {

        // The first token must be a [ or else it's an error
        assertTokenValue(firstToken, "[");

        const elements = [];
        let token = next();
        
        while (token && token.value !== "]") {

            // add the value into the array
            elements.push(parseValue(token));

            token = next();
            
            if (token.value === ",") {
                token = next();
            } else {
                break;
            }
        }

        assertTokenValue(token, "]");

        return t.array(elements, {
            type: "Array",
            elements,
            loc: {
                start: {
                    ...firstToken.loc.start
                },
                end: {
                    ...token.loc.end
                }
            }
        });

    }



    function parseValue(token) {

        token = token || next();
        
        switch (token.type) {
        case "String":
        case "Boolean":
        case "Number":
        case "Null":
            return createLiteralNode(token);

        case "Punctuator":
            if (token.value === "{") {
                return parseObject(token);
            } else if (token.value === "[") {
                return parseArray(token);
            }
            /*falls through*/

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
                index: 0
            },
            end: {
                ...docBody.loc.end
            }
        }
    };

    if (options.tokens) {
        docParts.tokens = tokens;
    }

    return t.document(docBody, docParts);

}
