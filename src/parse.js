/**
 * @fileoverview JSON parser
 * @author Nicholas C. Zakas
 */


//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { tokens, escapes } from "./tokens.js";

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------


function getStringValue(value) {
    
    // slice off the quotation marks
    value = value.slice(1, -1);
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
        if (escapes.has(escapeChar)) {
            result += escapes.get(escapeChar);
            lastIndex = escapeIndex + 2;
        } else if (escapeChar === "u") {
            const hexCode = value.slice(escapeIndex + 2, escapeIndex + 6);
            if (hexCode.length < 4 || /[^0-9a-f]/i.test(hexCode)) {
                throw new Error("Invalid unicode escape: " + hexCode);
            }
            
            result += String.fromCharCode(parseInt(hexCode, 16));
            lastIndex = escapeIndex + 6;
        } else {
            throw new Error(`Invalid escape character: ${ escapeChar }.`);
        }

        // find the next escape sequence
        escapeIndex = value.indexOf("\\", lastIndex);
    }

    // get the last segment of the string value
    result += value.slice(lastIndex);

    return result;
}

function getLiteralValue(token) {
    switch (token.type) {
        case "Boolean":
            return Boolean(token.value);
        
        case "Number":
            return Number(token.value);

        case "Null":
            return null;

        case "String":
            return getStringValue(token.value);
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
 * @returns {Object} The AST representing the parsed JSON.
 * @throws {Error} When there is a parsing error. 
 */
export function parse(text, options = { tokens:false }) {

    const returnTokens = !!options.tokens;

    const iterator = tokens(text);

    function assertTokenValue(token, value) {
        if (!token || token.value !== value) {
            // TODO: Better error
            throw new Error(`Unexpected token "${token.value}"`);
        }
    }

    function assertTokenType(token, type) {
        if (!token || token.type !== type) {
            // TODO: Better error
            throw new Error(`Unexpected token type "${token.type} (${ token.value })"`);
        }
    }

    function parseProperty(token) {
        assertTokenType(token, "String");
        const name = createLiteralNode(token);

        token = iterator.next().value;
        assertTokenValue(token, ":");
        const value = parseValue();

        return {
            type: "Property",
            name,
            value,
            loc: {
                start: {
                    ...name.loc.start
                },
                end: {
                    ...value.loc.end
                }
            }
        };
    }

    function parseObject(firstToken) {

        // The first token must be a { or else it's an error
        assertTokenValue(firstToken, "{");

        const body = [];
        let token = iterator.next().value;

        while (token && token.value !== "}") {

            // add the value into the array
            body.push(parseProperty(token));

            token = iterator.next().value;

            if (token.value === ",") {
                token = iterator.next().value;
            } else {
                break;
            }
        }

        assertTokenValue(token, "}");

        return {
            type: "Object",
            body,
            loc: {
                start: {
                    ...firstToken.loc.start
                },
                end: {
                    ...token.loc.end
                }
            }
        };

    }

    function parseArray(firstToken) {

        // The first token must be a [ or else it's an error
        assertTokenValue(firstToken, "[");

        const items = [];
        let token = iterator.next().value;
        
        while (token && token.value !== "]") {

            // add the value into the array
            items.push(parseValue(token));

            token = iterator.next().value;
            
            if (token.value === ",") {
                token = iterator.next().value;
            } else {
                break;
            }
        }

        assertTokenValue(token, "]");

        return {
            type: "Array",
            items,
            loc: {
                start: {
                    ...firstToken.loc.start
                },
                end: {
                    ...token.loc.end
                }
            }
        };

    }



    function parseValue(token) {

        token = token || iterator.next().value;
        
        switch (token.type) {
            case "String":
            case "Boolean":
            case "Number":
            case "Null":
            case "Number":
                return createLiteralNode(token);

            case "Punctuator":
                if (token.value === "{") {
                    return parseObject(token);
                } else if (token.value === "[") {
                    return parseArray(token);
                }

            default:
                // TODO: Better error
                throw new Error(`Unexpected token type "${ token.type }" (${ token.value }) at ${ token.loc.start.index }.`);
        }

    }


    const root = {
        type: "Document",
        body: parseValue(),
        loc: {
            start: {
                line: 1,
                column: 1,
                index: 0
            },
            end: null
        }
    };

    root.loc.end = {
        ...root.body.loc.end
    };

    return root;

}