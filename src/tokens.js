/**
 * @fileoverview JSON tokenizer
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { escapeToChar, expectedKeywords, knownTokenTypes } from "./syntax.js";
import { UnexpectedChar, UnexpectedEOF } from "./errors.js";

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

const QUOTE = "\"";
const SLASH = "/";
const STAR = "*";

const DEFAULT_OPTIONS = {
    comments: false,
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

//-----------------------------------------------------------------------------
// Main
//-----------------------------------------------------------------------------

/**
 * Creates an iterator over the tokens representing the source text.
 * @param {string} text The source text to tokenize.
 * @returns {Iterator} An iterator over the tokens. 
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

    const tokens = [];


    function createToken(tokenType, value, startLoc, endLoc) {
        
        const endOffset = startLoc.offset + value.length;
        let range = options.ranges ? {
            range: [startLoc.offset, endOffset]
        } : undefined;
        
        return {
            type: tokenType,
            value,
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
            if (text.charAt(offset + 1) === "\n") {
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

    function readString(c) {
        let value = c;
        c = next();

        while (c && c !== QUOTE) {

            // escapes
            if (c === "\\") {
                value += c;
                c = next();

                if (escapeToChar.has(c)) {
                    value += c;
                } else if (c === "u") {
                    value += c;
                    for (let i = 0; i < 4; i++) {
                        c = next();
                        if (isHexDigit(c)) {
                            value += c;
                        } else {
                            unexpected(c);
                        }
                    }
                } else {
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

        // Number may start with a minus but not a plus
        if (c === "-") {

            value += c;

            c = next();

            // Next digit cannot be zero
            if (!isDigit(c)) {
                unexpected(c);
            }

        }

        // Zero must be followed by a decimal point or nothing
        if (c === "0") {

            value += c;

            c = next();
            if (isDigit(c)) {
                unexpected(c);
            }

        } else {
            if (!isPositiveDigit(c)) {
                unexpected(c);
            }

            do {
                value += c;
                c = next();
            } while (isDigit(c));
        }

        // Decimal point may be followed by any number of digits
        if (c === ".") {

            do {
                value += c;
                c = next();
            } while (isDigit(c));
        }

        // Exponent is always last
        if (c === "e" || c === "E") {

            value += c;
            c = next();

            if (c === "+" || c === "-") {
                value += c;
                c = next();
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
     * @returns {string} The comment string.
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

        // check for easy case
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
        } else if (c === QUOTE) {
            const result = readString(c);
            let value = result.value;
            c = result.c;
            tokens.push(createToken("String", value, start));
        } else if (c === SLASH && options.comments) {
            const result = readComment(c);
            let value = result.value;
            c = result.c;
            tokens.push(createToken(value.startsWith("//") ? "LineComment" : "BlockComment", value, start, locate()));
        } else {
            unexpected(c);
        }
    }

    return tokens;

}
