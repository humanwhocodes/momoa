/**
 * @fileoverview JSON tokenizer
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import {
    escapeToChar,
    expectedKeywords,
    knownTokenTypes,
    knownJSON5TokenTypes,
    json5EscapeToChar,
    json5LineTerminators,
} from "./syntax.js";
import { UnexpectedChar, UnexpectedEOF } from "./errors.js";
import { ID_Start, ID_Continue } from "./unicode.js";

//-----------------------------------------------------------------------------
// Typedefs
//-----------------------------------------------------------------------------

/** @typedef {import("./typedefs").Location} Location */
/** @typedef {import("./typedefs").Range} Range */
/** @typedef {import("./typedefs").Token} Token */
/** @typedef {import("./typedefs").TokenType} TokenType */
/** @typedef {import("./typedefs").TokenizeOptions} TokenizeOptions */

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

const DOUBLE_QUOTE = "\"";
const SINGLE_QUOTE = "'";
const SLASH = "/";
const STAR = "*";
const INFINITY = "Infinity";
const NAN = "NaN";

const DEFAULT_OPTIONS = {
    mode: "json",
    ranges: false
};

function isWhitespace(c) {
    return /[\s\n]/.test(c);
}

function isDigit(c) {
    return c >= "0" && c <= "9";
}

function isHexDigit(c) {
    return isDigit(c) || /[a-f]/i.test(c);
}

function isPositiveDigit(c) {
    return c >= "1" && c <= "9";
}

function isKeywordStart(c) {
    return /[tfn]/.test(c);
}

function isNumberStart(c) {
    return isDigit(c) || c === "." || c === "-";
}

function isJSON5NumberStart(c) {
    return isNumberStart(c) || c === "+";
}

function isStringStart(c, json5) {
    return c === DOUBLE_QUOTE || (json5 && c === SINGLE_QUOTE);
}

/**
 * Tests that a given character is a valid first character of a
 * JSON5 identifier
 * @param {string} c The character to check.
 * @returns {boolean} `true` if the character is a valid first character. 
 */
function isJSON5IdentifierStart(c) {

    // fast path for common case
    // eslint-disable-next-line no-misleading-character-class
    if (/[$_a-zA-Z\u200C\u200D\\]/i.test(c)) {
        return true;
    }

    return ID_Start.test(c);
}

/**
 * Tests that a given character is a valid part of a JSON5 identifier.
 * @param {string} c The character to check.
 * @returns {boolean} `true` if the character is a valid part of an identifier.
 */
function isJSON5IdentifierPart(c) {

    // fast path for common case
    // eslint-disable-next-line no-misleading-character-class
    if (/[$_a-zA-Z0-9\u200C\u200D\\]/i.test(c)) {
        return true;
    }

    return ID_Continue.test(c);
}

//-----------------------------------------------------------------------------
// Main
//-----------------------------------------------------------------------------

/**
 * Creates an iterator over the tokens representing the source text.
 * @param {string} text The source text to tokenize.
 * @param {TokenizeOptions} options Options for doing the tokenization.
 * @returns {Array<Token>} An iterator over the tokens. 
 */
export function tokenize(text, options) {

    options = Object.freeze({
        ...DEFAULT_OPTIONS,
        ...options
    });

    let offset = -1;
    let line = 1;
    let column = 0;
    let newLine = false;
    const json5 = options.mode === "json5";
    const allowComments = options.mode !== "json";

    const tokens = [];

    // convenience functions to abstract JSON5-specific logic
    const isEscapedCharacter = json5 ? json5EscapeToChar.has.bind(json5EscapeToChar) : escapeToChar.has.bind(escapeToChar);
    const isJSON5LineTerminator = json5 ? json5LineTerminators.has.bind(json5LineTerminators) : () => false;
    const isJSON5HexEscape = json5 ? c => c === "x" : () => false;

    /**
     * Creates a new token.
     * @param {TokenType} tokenType The type of token to create. 
     * @param {string} value The value of the token. 
     * @param {Location} startLoc The start location for the token.
     * @param {Location} [endLoc] The end location for the token.
     * @returns {Token} The token.
     */
    function createToken(tokenType, value, startLoc, endLoc) {
        
        const endOffset = startLoc.offset + value.length;

        let range = options.ranges ? {
            range: /** @type {Range} */ ([startLoc.offset, endOffset])
        } : undefined;

        return {
            type: tokenType,
            loc: {
                start: startLoc,
                end: endLoc || {
                    line: startLoc.line,
                    column: startLoc.column + value.length,
                    offset: endOffset
                }
            },
            ...range
        };
    }

    function peek() {
        return text.charAt(offset + 1);
    }


    function next() {
        let c = text.charAt(++offset);
    
        if (newLine) {
            line++;
            column = 1;
            newLine = false;
        } else {
            column++;
        }

        if (c === "\r") {
            newLine = true;

            // if we already see a \r, just ignore upcoming \n
            if (peek() === "\n") {
                offset++;
            }
        } else if (c === "\n") {
            newLine = true;
        }

        return c;
    }


    function locate() {
        return {
            line,
            column,
            offset
        };
    }

    function readKeyword(c) {

        // get the expected keyword
        let value = expectedKeywords.get(c);

        // check to see if it actually exists
        if (text.slice(offset, offset + value.length) === value) {
            offset += value.length - 1;
            column += value.length - 1;
            return { value, c: next() };
        }

        // find the first unexpected character
        for (let j = 1; j < value.length; j++) {
            if (value[j] !== text.charAt(offset + j)) {
                unexpected(next());
            }
        }

    }

    function readJSON5Identifier(c) {
            
        let value = "";

        do {

            value += c;

            if (c === "\\") {

                c = next();

                if (c !== "u") {
                    unexpected(c);
                }

                value += c;

                const result = readHexDigits(4);
                value += result.value;
                c = result.c;
            }

            c = next();

        } while (c && isJSON5IdentifierPart(c));

        return { value, c };
    }

    /**
     * Reads in a specific number of hex digits.
     * @param {number} count The number of hex digits to read.
     * @returns {{value:string, c:string}} The hex digits read and the last character read.
     */
    function readHexDigits(count) {
        let value = "";

        for (let i = 0; i < count; i++) {
            c = next();
            if (isHexDigit(c)) {
                value += c;
                continue;
            }

            unexpected(c);
        }

        return { value, c };
    }

    function readString(c) {
        const delimiter = c;
        let value = c;
        c = next();

        while (c && c !== delimiter) {

            // escapes
            if (c === "\\") {
                value += c;
                c = next();

                if (isEscapedCharacter(c) || isJSON5LineTerminator(c)) {
                    value += c;
                } else if (c === "u") {
                    value += c;

                    const result = readHexDigits(4);
                    value += result.value;
                    c = result.c;

                } else if (isJSON5HexEscape(c)) {
                    // hex escapes: \xHH
                    value += c;
                    
                    const result = readHexDigits(2);
                    value += result.value;
                    c = result.c;
                } else if (!json5) {  // JSON doesn't allow anything else
                    unexpected(c);
                }
            } else {
                value += c;
            }

            c = next();
        }

        if (!c) {
            unexpectedEOF();
        }
        
        value += c;

        return { value, c: next() };
    }


    function readNumber(c) {

        let value = "";

        // JSON number may start with a minus but not a plus
        // JSON5 allows a plus.
        if (c === "-" || json5 && c === "+") {
            const sign = c;

            value += c;

            c = next();

            /*
             * JSON5 allows Infinity or NaN preceded by a sign.
             * This blocks handles +Infinity, -Infinity, +NaN, and -NaN.
             * Standalone Infinity and NaN are handled in `readJSON5Identifier()`
             */
            if (json5) {

                if (c === "I" && text.slice(offset, offset + INFINITY.length) === INFINITY) {
                    offset += INFINITY.length - 1;
                    column += INFINITY.length - 1;
                    return { value: sign + INFINITY, c: next() };
                }

                if (c === "N" && text.slice(offset, offset + NAN.length) === NAN) {
                    offset += NAN.length - 1;
                    column += NAN.length - 1;
                    return { value: sign + NAN, c: next() };
                }
            }

            // Next digit cannot be zero
            if (!isDigit(c)) {
                unexpected(c);
            }

        }

        /*
         * In JSON, a zero must be followed by a decimal point or nothing.
         * In JSON5, a zero can additionally be followed by an `x` indicating
         * that it's a hexadecimal number.
         */
        if (c === "0") {

            value += c;

            c = next();

            // check for a hex number
            if (json5 && (c === "x" || c === "X")) {
                value += c;
                c = next();

                if (!isHexDigit(c)) {
                    unexpected(c);
                }

                do {
                    value += c;
                    c = next();
                } while (isHexDigit(c));

            } else if (isDigit(c)) {
                unexpected(c);
            }

        } else {

            // JSON5 allows leading decimal points
            if (!json5 || c !== ".") {
                if (!isPositiveDigit(c)) {
                    unexpected(c);
                }

                do {
                    value += c;
                    c = next();
                } while (isDigit(c));
            }
        }

        /*
         * In JSON, a decimal point must be followed by at least one digit.
         * In JSON5, a decimal point need not be followed by any digits.
         */
        if (c === ".") {

            let digitCount = -1;

            do {
                value += c;
                digitCount++;
                c = next();
            } while (isDigit(c));

            if (!json5 && digitCount === 0) {
                if (c) {
                    unexpected(c);
                } else {
                    unexpectedEOF();
                }
            }
        }

        // Exponent is always last
        if (c === "e" || c === "E") {

            value += c;
            c = next();

            if (c === "+" || c === "-") {
                value += c;
                c = next();
            }

            /*
             * Must always have a digit in this position to avoid:
             * 5e
             * 12E+
             * 42e-
             */
            if (!c) {
                unexpectedEOF();
            }

            if (!isDigit(c)) {
                unexpected(c);
            }

            while (isDigit(c)) {
                value += c;
                c = next();
            }
        }


        return { value, c };
    }

    /**
     * Reads in either a single-line or multi-line comment.
     * @param {string} c The first character of the comment.
     * @returns {{value:string, c:string}} The comment string.
     * @throws {UnexpectedChar} when the comment cannot be read.
     * @throws {UnexpectedEOF} when EOF is reached before the comment is
     *      finalized.
     */
    function readComment(c) {

        let value = c;

        // next character determines single- or multi-line
        c = next();

        // single-line comments
        if (c === "/") {
            
            do {
                value += c;
                c = next();
            } while (c && c !== "\r" && c !== "\n");

            return { value, c };
        }

        // multi-line comments
        if (c === STAR) {

            while (c) {
                value += c;
                c = next();

                // check for end of comment
                if (c === STAR) {
                    value += c;
                    c = next();
                    
                    //end of comment
                    if (c === SLASH) {
                        value += c;

                        /*
                         * The single-line comment functionality cues up the
                         * next character, so we do the same here to avoid
                         * splitting logic later.
                         */
                        c = next();
                        return { value, c };
                    }
                }
            }

            unexpectedEOF();
            
        }

        // if we've made it here, there's an invalid character
        unexpected(c);        
    }


    /**
     * Convenience function for throwing unexpected character errors.
     * @param {string} c The unexpected character.
     * @returns {void}
     * @throws {UnexpectedChar} always.
     */
    function unexpected(c) {
        throw new UnexpectedChar(c, locate());
    }

    /**
     * Convenience function for throwing unexpected EOF errors.
     * @returns {void}
     * @throws {UnexpectedEOF} always.
     */
    function unexpectedEOF() {
        throw new UnexpectedEOF(locate());
    }

    let c = next();

    while (offset < text.length) {

        while (isWhitespace(c)) {
            c = next();
        }

        if (!c) {
            break;
        }

        const start = locate();

        // check for JSON5 syntax only
        if (json5) {

            if (knownJSON5TokenTypes.has(c)) {
                tokens.push(createToken(knownJSON5TokenTypes.get(c), c, start));
                c = next();
            } else if (isJSON5IdentifierStart(c)) {
                const result = readJSON5Identifier(c);
                let value = result.value;
                c = result.c;

                if (knownJSON5TokenTypes.has(value)) {
                    tokens.push(createToken(knownJSON5TokenTypes.get(value), value, start));
                } else {
                    tokens.push(createToken("Identifier", value, start));
                }
            } else if (isJSON5NumberStart(c)) {
                const result = readNumber(c);
                let value = result.value;
                c = result.c;
                tokens.push(createToken("Number", value, start));
            } else if (isStringStart(c, json5)) {
                const result = readString(c);
                let value = result.value;
                c = result.c;
                tokens.push(createToken("String", value, start, locate()));
            } else if (c === SLASH && allowComments) {
                const result = readComment(c);
                let value = result.value;
                c = result.c;
                tokens.push(createToken(value.startsWith("//") ? "LineComment" : "BlockComment", value, start, locate()));
            } else {
                unexpected(c);
            }

        } else {

            // check for JSON/JSONC syntax only
            if (knownTokenTypes.has(c)) {
                tokens.push(createToken(knownTokenTypes.get(c), c, start));
                c = next();
            } else if (isKeywordStart(c)) {
                const result = readKeyword(c);
                let value = result.value;
                c = result.c;
                tokens.push(createToken(knownTokenTypes.get(value), value, start));
            } else if (isNumberStart(c)) {
                const result = readNumber(c);
                let value = result.value;
                c = result.c;
                tokens.push(createToken("Number", value, start));
            }
            else if (isStringStart(c, json5)) {
                const result = readString(c);
                let value = result.value;
                c = result.c;
                tokens.push(createToken("String", value, start));
            } else if (c === SLASH && allowComments) {
                const result = readComment(c);
                let value = result.value;
                c = result.c;
                tokens.push(createToken(value.startsWith("//") ? "LineComment" : "BlockComment", value, start, locate()));
            } else {
                unexpected(c);
            }
        }

        // check for common cases

    }

    return tokens;

}
