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
import { CharCodeReader } from "./char-code-reader.js";
import * as charCodes from "./char-codes.js";

//-----------------------------------------------------------------------------
// Typedefs
//-----------------------------------------------------------------------------

/** @typedef {import("./typedefs.ts").Location} Location */
/** @typedef {import("./typedefs.ts").Range} Range */
/** @typedef {import("./typedefs.ts").Token} Token */
/** @typedef {import("./typedefs.ts").TokenType} TokenType */
/** @typedef {import("./typedefs.ts").TokenizeOptions} TokenizeOptions */

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

const INFINITY = "Infinity";
const NAN = "NaN";

const keywordStarts = new Set([charCodes.CHAR_LOWER_T, charCodes.CHAR_LOWER_F, charCodes.CHAR_LOWER_N]);
const whitespace = new Set([charCodes.CHAR_SPACE, charCodes.CHAR_TAB, charCodes.CHAR_NEWLINE, charCodes.CHAR_RETURN]);
const json5Whitespace = new Set([
    ...whitespace,
    charCodes.CHAR_VTAB,
    charCodes.CHAR_FORM_FEED,
    charCodes.CHAR_NBSP,
    charCodes.CHAR_LINE_SEPARATOR,
    charCodes.CHAR_PARAGRAPH_SEPARATOR,
    charCodes.CHAR_BOM,
    charCodes.CHAR_NON_BREAKING_SPACE,
    charCodes.CHAR_EN_QUAD,
    charCodes.CHAR_EM_QUAD,
    charCodes.CHAR_EN_SPACE,
    charCodes.CHAR_EM_SPACE,
    charCodes.CHAR_THREE_PER_EM_SPACE,
    charCodes.CHAR_FOUR_PER_EM_SPACE,
    charCodes.CHAR_SIX_PER_EM_SPACE,
    charCodes.CHAR_FIGURE_SPACE,
    charCodes.CHAR_PUNCTUATION_SPACE,
    charCodes.CHAR_THIN_SPACE,
    charCodes.CHAR_HAIR_SPACE,
    charCodes.CHAR_NARROW_NO_BREAK_SPACE,
    charCodes.CHAR_MEDIUM_MATHEMATICAL_SPACE,
    charCodes.CHAR_IDEOGRAPHIC_SPACE,
]);


const DEFAULT_OPTIONS = {
    mode: "json",
    ranges: false
};

// #region Helpers


/**
 * Determines if a given character is a decimal digit.
 * @param {number} c The character to check.
 * @returns {boolean} `true` if the character is a digit.
 */
function isDigit(c) {
    return c >= charCodes.CHAR_0 && c <= charCodes.CHAR_9;
}

/**
 * Determines if a given character is a hexadecimal digit.
 * @param {number} c The character to check.
 * @returns {boolean} `true` if the character is a hexadecimal digit.
 */
function isHexDigit(c) {
    return isDigit(c) ||
        c >= charCodes.CHAR_UPPER_A && c <= charCodes.CHAR_UPPER_F ||
        c >= charCodes.CHAR_LOWER_A && c <= charCodes.CHAR_LOWER_F;
}

/**
 * Determines if a given character is a positive digit (1-9).
 * @param {number} c The character to check.
 * @returns {boolean} `true` if the character is a positive digit.
 */
function isPositiveDigit(c) {
    return c >= charCodes.CHAR_1 && c <= charCodes.CHAR_9;
}

/**
 * Determines if a given character is the start of a keyword.
 * @param {number} c The character to check.
 * @returns {boolean} `true` if the character is the start of a keyword.
 */
function isKeywordStart(c) {
    return keywordStarts.has(c);
}

/**
 * Determines if a given character is the start of a number.
 * @param {number} c The character to check.
 * @returns {boolean} `true` if the character is the start of a number.
 */
function isNumberStart(c) {
    return isDigit(c) || c === charCodes.CHAR_DOT || c === charCodes.CHAR_MINUS;
}

/**
 * Determines if a given character is the start of a JSON5 number.
 * @param {number} c The character to check.
 * @returns {boolean} `true` if the character is the start of a JSON5 number.
 */
function isJSON5NumberStart(c) {
    return isNumberStart(c) || c === charCodes.CHAR_PLUS;
}

/**
 * Determines if a given character is the start of a string.
 * @param {number} c The character to check.
 * @param {boolean} json5 `true` if JSON5 mode is enabled.
 * @returns {boolean} `true` if the character is the start of a string.
 */
function isStringStart(c, json5) {
    return c === charCodes.CHAR_DOUBLE_QUOTE || (json5 && c === charCodes.CHAR_SINGLE_QUOTE);
}

/**
 * Tests that a given character is a valid first character of a
 * JSON5 identifier
 * @param {number} c The character to check.
 * @returns {boolean} `true` if the character is a valid first character. 
 */
function isJSON5IdentifierStart(c) {

    // test simple cases first

    if (c === charCodes.CHAR_DOLLAR || c === charCodes.CHAR_UNDERSCORE || c === charCodes.CHAR_BACKSLASH) {
        return true;
    }

    if (c >= charCodes.CHAR_LOWER_A && c <= charCodes.CHAR_LOWER_Z || c >= charCodes.CHAR_UPPER_A && c <= charCodes.CHAR_UPPER_Z) {
        return true;
    }

    if (c === 0x200C || c === 0x200D) {
        return true;
    }
    
    const ct = String.fromCharCode(c);
    return ID_Start.test(ct);
}

/**
 * Tests that a given character is a valid part of a JSON5 identifier.
 * @param {number} c The character to check.
 * @returns {boolean} `true` if the character is a valid part of an identifier.
 */
function isJSON5IdentifierPart(c) {

    // fast path for simple cases
    if (isJSON5IdentifierStart(c) || isDigit(c)) {
        return true;
    }

    const ct = String.fromCharCode(c);
    return ID_Continue.test(ct);
}

// #endregion

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

    const json5 = options.mode === "json5";
    const allowComments = options.mode !== "json";
    const reader = new CharCodeReader(text);

    const tokens = [];

    // convenience functions to abstract JSON5-specific logic
    const isEscapedCharacter = json5 ? json5EscapeToChar.has.bind(json5EscapeToChar) : escapeToChar.has.bind(escapeToChar);
    const isJSON5LineTerminator = json5 ? json5LineTerminators.has.bind(json5LineTerminators) : () => false;
    const isJSON5HexEscape = json5 ? c => c === charCodes.CHAR_LOWER_X : () => false;
    const isWhitespace = json5 ? json5Whitespace.has.bind(json5Whitespace) : whitespace.has.bind(whitespace);

    /**
     * Creates a new token.
     * @param {TokenType} tokenType The type of token to create. 
     * @param {number} length The length of the token. 
     * @param {Location} startLoc The start location for the token.
     * @param {Location} [endLoc] The end location for the token.
     * @returns {Token} The token.
     */
    function createToken(tokenType, length, startLoc, endLoc) {
        
        const endOffset = startLoc.offset + length;

        let range = options.ranges ? {
            range: /** @type {Range} */ ([startLoc.offset, endOffset])
        } : undefined;

        return {
            type: tokenType,
            loc: {
                start: startLoc,
                end: endLoc || {
                    line: startLoc.line,
                    column: startLoc.column + length,
                    offset: endOffset
                }
            },
            ...range
        };
    }

    /**
     * Reads in a character sequence.
     * @param {string} text The character sequence to read.
     * @returns {boolean} `true` if the character sequence was read.
     */
    function readCharSequence(text) {
       
        for (let i = 0; i < text.length; i++) {
            if (reader.peek() !== text.charCodeAt(i)) {
                return false;
            }
            reader.next();
        }
        
        return true;
    }

    /**
     * Reads in a keyword.
     * @param {number} c The first character of the keyword.
     * @returns {{value:string, c:number}} The keyword and the next character.
     * @throws {UnexpectedChar} when the keyword cannot be read.
     */
    function readKeyword(c) {

        // get the expected keyword
        let sequence = expectedKeywords.get(c);
        let value = String.fromCharCode(c);

        // find the first unexpected character
        for (let j = 0; j < sequence.length; j++) {
            const nc = reader.next();
            if (sequence[j] !== nc) {
                unexpected(nc);
            }
            value += String.fromCharCode(nc);
        }

        return {
            value,
            c: reader.next()
        };
    }

    /**
     * Reads in a JSON5 identifier.
     * @param {number} c The first character of the identifier.
     * @returns {{value:string, c:number}} The identifier and the next character.
     * @throws {UnexpectedChar} when the identifier cannot be read.
     * @throws {UnexpectedEOF} when EOF is reached before the identifier is finalized.
     */
    function readJSON5Identifier(c) {
            
        let value = "";

        do {

            value += String.fromCharCode(c);

            if (c === charCodes.CHAR_BACKSLASH) {

                c = reader.next();

                if (c !== charCodes.CHAR_LOWER_U) {
                    unexpected(c);
                }

                value += String.fromCharCode(c);

                const result = readHexDigits(4);
                value += result.value;
                c = result.c;
            }

            c = reader.next();

        } while (c > -1 && isJSON5IdentifierPart(c));

        return { value, c };
    }

    /**
     * Reads in a specific number of hex digits.
     * @param {number} count The number of hex digits to read.
     * @returns {{value:string, c:number}} The hex digits read and the last character read.
     */
    function readHexDigits(count) {
        let value = "";

        for (let i = 0; i < count; i++) {
            c = reader.next();
            if (isHexDigit(c)) {
                value += String.fromCharCode(c);
                continue;
            }

            unexpected(c);
        }

        return { value, c };
    }

    /**
     * Reads in a string.
     * @param {number} c The first character of the string.
     * @returns {{length:number, c:number}} The length of the string and the next character.
     */
    function readString(c) {
        const delimiter = c;
        let length = 1;
        c = reader.next();

        while (c !== -1 && c !== delimiter) {

            // escapes
            if (c === charCodes.CHAR_BACKSLASH) {
                length++;
                c = reader.next();

                if (isEscapedCharacter(c) || isJSON5LineTerminator(c)) {
                    length++;
                } else if (c === charCodes.CHAR_LOWER_U) {
                    length++;

                    const result = readHexDigits(4);
                    length += result.value.length;
                    c = result.c;

                } else if (isJSON5HexEscape(c)) {
                    // hex escapes: \xHH
                    length++;
                    
                    const result = readHexDigits(2);
                    length += result.value.length;
                    c = result.c;
                } else if (!json5) {  // JSON doesn't allow anything else
                    unexpected(c);
                }
            } else {
                length++;
            }

            c = reader.next();
        }

        if (c === -1) {
            unexpectedEOF();
        }
        
        length++;

        return { length, c: reader.next() };
    }

    /**
     * Reads in a number.
     * @param {number} c The first character of the number.
     * @returns {{length:number, c:number}} The length of the number and the next character.
     * @throws {UnexpectedChar} when the number cannot be read.
     * @throws {UnexpectedEOF} when EOF is reached before the number is finalized.
     */ 
    function readNumber(c) {

        let length = 0;

        // JSON number may start with a minus but not a plus
        // JSON5 allows a plus.
        if (c === charCodes.CHAR_MINUS || json5 && c === charCodes.CHAR_PLUS) {
            length++;

            c = reader.next();

            /*
             * JSON5 allows Infinity or NaN preceded by a sign.
             * This blocks handles +Infinity, -Infinity, +NaN, and -NaN.
             * Standalone Infinity and NaN are handled in `readJSON5Identifier()`
             */
            if (json5) {

                if (c === charCodes.CHAR_UPPER_I && readCharSequence("nfinity")) {
                    return { length: INFINITY.length + 1, c: reader.next() };
                }

                if (c === charCodes.CHAR_UPPER_N && readCharSequence("aN")) {
                    return { length: NAN.length + 1, c: reader.next() };
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
        if (c === charCodes.CHAR_0) {

            length++;

            c = reader.next();

            // check for a hex number
            if (json5 && (c === charCodes.CHAR_LOWER_X || c === charCodes.CHAR_UPPER_X)) {
                length++;
                c = reader.next();

                if (!isHexDigit(c)) {
                    unexpected(c);
                }

                do {
                    length++;
                    c = reader.next();
                } while (isHexDigit(c));

            } else if (isDigit(c)) {
                unexpected(c);
            }

        } else {

            // JSON5 allows leading decimal points
            if (!json5 || c !== charCodes.CHAR_DOT) {
                if (!isPositiveDigit(c)) {
                    unexpected(c);
                }

                do {
                    length++;
                    c = reader.next();
                } while (isDigit(c));
            }
        }

        /*
         * In JSON, a decimal point must be followed by at least one digit.
         * In JSON5, a decimal point need not be followed by any digits.
         */
        if (c === charCodes.CHAR_DOT) {

            let digitCount = -1;

            do {
                length++;
                digitCount++;
                c = reader.next();
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
        if (c === charCodes.CHAR_LOWER_E || c === charCodes.CHAR_UPPER_E) {

            length++;
            c = reader.next();

            if (c === charCodes.CHAR_PLUS || c === charCodes.CHAR_MINUS) {
                length++;
                c = reader.next();
            }

            /*
             * Must always have a digit in this position to avoid:
             * 5e
             * 12E+
             * 42e-
             */
            if (c === -1) {
                unexpectedEOF();
            }

            if (!isDigit(c)) {
                unexpected(c);
            }

            while (isDigit(c)) {
                length++;
                c = reader.next();
            }
        }


        return { length, c };
    }

    /**
     * Reads in either a single-line or multi-line comment.
     * @param {number} c The first character of the comment.
     * @returns {{length:number,c:number, multiline:boolean}} The comment info.
     * @throws {UnexpectedChar} when the comment cannot be read.
     * @throws {UnexpectedEOF} when EOF is reached before the comment is
     *      finalized.
     */
    function readComment(c) {

        let length = 1;

        // next character determines single- or multi-line
        c = reader.next();

        // single-line comments
        if (c === charCodes.CHAR_SLASH) {
            
            do {
                length += 1;
                c = reader.next();
            } while (c > -1 && c !== charCodes.CHAR_RETURN && c !== charCodes.CHAR_NEWLINE);

            return { length, c, multiline: false };
        }

        // multi-line comments
        if (c === charCodes.CHAR_STAR) {

            while (c > -1) {
                length += 1;
                c = reader.next();

                // check for end of comment
                if (c === charCodes.CHAR_STAR) {
                    length += 1;
                    c = reader.next();
                    
                    //end of comment
                    if (c === charCodes.CHAR_SLASH) {
                        length += 1;

                        /*
                         * The single-line comment functionality cues up the
                         * next character, so we do the same here to avoid
                         * splitting logic later.
                         */
                        c = reader.next();
                        return { length, c, multiline: true };
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
     * @param {number} c The unexpected character.
     * @returns {void}
     * @throws {UnexpectedChar} always.
     */
    function unexpected(c) {
        throw new UnexpectedChar(c, reader.locate());
    }

    /**
     * Convenience function for throwing unexpected EOF errors.
     * @returns {void}
     * @throws {UnexpectedEOF} always.
     */
    function unexpectedEOF() {
        throw new UnexpectedEOF(reader.locate());
    }

    let c = reader.next();

    while (c > -1) {

        while (isWhitespace(c)) {
            c = reader.next();
        }

        if (c === -1) {
            break;
        }

        const start = reader.locate();
        const ct = String.fromCharCode(c);

        // check for JSON5 syntax only
        if (json5) {

            if (knownJSON5TokenTypes.has(ct)) {
                tokens.push(createToken(knownJSON5TokenTypes.get(ct), 1, start));
                c = reader.next();
            } else if (isJSON5IdentifierStart(c)) {
                const result = readJSON5Identifier(c);
                let value = result.value;
                c = result.c;

                if (knownJSON5TokenTypes.has(value)) {
                    tokens.push(createToken(knownJSON5TokenTypes.get(value), value.length, start));
                } else {
                    tokens.push(createToken("Identifier", value.length, start));
                }
            } else if (isJSON5NumberStart(c)) {
                const result = readNumber(c);
                c = result.c;
                tokens.push(createToken("Number", result.length, start));
            } else if (isStringStart(c, json5)) {
                const result = readString(c);
                c = result.c;
                tokens.push(createToken("String", result.length, start, reader.locate()));
            } else if (c === charCodes.CHAR_SLASH && allowComments) {
                const result = readComment(c);
                c = result.c;
                tokens.push(createToken(!result.multiline ? "LineComment" : "BlockComment", result.length, start, reader.locate()));
            } else {
                unexpected(c);
            }

        } else {

            const ct = String.fromCharCode(c);

            // check for JSON/JSONC syntax only
            if (knownTokenTypes.has(ct)) {
                tokens.push(createToken(knownTokenTypes.get(ct), 1, start));
                c = reader.next();
            } else if (isKeywordStart(c)) {
                const result = readKeyword(c);
                let value = result.value;
                c = result.c;
                tokens.push(createToken(knownTokenTypes.get(value), value.length, start));
            } else if (isNumberStart(c)) {
                const result = readNumber(c);
                c = result.c;
                tokens.push(createToken("Number", result.length, start));
            }
            else if (isStringStart(c, json5)) {
                const result = readString(c);
                c = result.c;
                tokens.push(createToken("String", result.length, start));
            } else if (c === charCodes.CHAR_SLASH && allowComments) {
                const result = readComment(c);
                c = result.c;
                tokens.push(createToken(!result.multiline ? "LineComment" : "BlockComment", result.length, start, reader.locate()));
            } else {
                unexpected(c);
            }
        }

        // check for common cases

    }

    return tokens;

}
