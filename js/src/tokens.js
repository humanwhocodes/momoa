/**
 * @fileoverview JSON tokenizer
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import {
    escapeToChar,
    knownTokenTypes,
    knownJSON5TokenTypes,
    json5EscapeToChar,
    json5LineTerminators,
} from "./syntax.js";
import { UnexpectedChar, UnexpectedEOF, UnexpectedIdentifier } from "./errors.js";
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

const jsonKeywords = new Set(["true", "false", "null"]);

export const tt = {
    EOF: 0,
    Number: 1,
    String: 2,
    Boolean: 3,
    Null: 4,
    NaN: 5,
    Infinity: 6,
    Identifier: 7,
    Colon: 20,
    LBrace: 21,
    RBrace: 22,
    LBracket: 23,
    RBracket: 24,
    Comma: 25,
    LineComment: 40,
    BlockComment: 41
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

export class Tokenizer {

    /**
     * Options for the tokenizer.
     * @type {TokenizeOptions}
     */
    #options;

    /**
     * The source text to tokenize.
     * @type {string}
     */
    #text;

    /**
     * The reader for the source text.
     * @type {CharCodeReader}
     */
    #reader;

    /**
     * Indicates if the tokenizer is in JSON5 mode.
     * @type {boolean}
     */
    #json5;

    /**
     * Indicates if comments are allowed.
     * @type {boolean}
     */
    #allowComments;

    /**
     * Indicates if ranges should be included in the tokens.
     * @type {boolean}
     */
    #ranges;

    /**
     * The last token type read.
     * @type {Token}
     */
    #token;

    /**
     * Determines if a character is an escaped character.
     * @type {(c:number) => boolean}
     */
    #isEscapedCharacter;

    /**
     * Determines if a character is a JSON5 line terminator.
     * @type {(c:number) => boolean}
     */
    #isJSON5LineTerminator;


    /**
     * Determines if a character is a JSON5 hex escape.
     * @type {(c:number) => boolean}
     */
    #isJSON5HexEscape;

    /**
     * Determines if a character is whitespace.
     * @type {(c:number) => boolean}
     */
    #isWhitespace;

    /**
     * Creates a new instance of the tokenizer.
     * @param {string} text The source text
     * @param {TokenizeOptions} options Options for the tokenizer.
     */ 
    constructor(text, options) {
        this.#text = text;
        this.#options = {
            ...DEFAULT_OPTIONS,
            ...options
        };

        this.#reader = new CharCodeReader(text);
        this.#json5 = this.#options.mode === "json5";
        this.#allowComments = this.#options.mode !== "json";
        this.#ranges = this.#options.ranges;

        // TODO: Clean this up
        this.#isEscapedCharacter = this.#json5 ? json5EscapeToChar.has.bind(json5EscapeToChar) : escapeToChar.has.bind(escapeToChar);
        this.#isJSON5LineTerminator = this.#json5 ? json5LineTerminators.has.bind(json5LineTerminators) : () => false;
        this.#isJSON5HexEscape = this.#json5 ? c => c === charCodes.CHAR_LOWER_X : () => false;
        this.#isWhitespace = this.#json5 ? json5Whitespace.has.bind(json5Whitespace) : whitespace.has.bind(whitespace);
    }

    // #region Errors

    /**
     * Convenience function for throwing unexpected character errors.
     * @param {number} c The unexpected character.
     * @param {Location} [loc] The location of the unexpected character.
     * @returns {never}
     * @throws {UnexpectedChar} always.
     */
    #unexpected(c, loc = this.#reader.locate()) {
        throw new UnexpectedChar(c, loc);
    }

    /**
     * Convenience function for throwing unexpected identifier errors.
     * @param {string} identifier The unexpected identifier.
     * @param {Location} [loc] The location of the unexpected identifier.
     * @returns {never}
     * @throws {UnexpectedIdentifier} always.
     */
    #unexpectedIdentifier(identifier, loc = this.#reader.locate()) {
        throw new UnexpectedIdentifier(identifier, loc);
    }

    /**
    * Convenience function for throwing unexpected EOF errors.
    * @returns {never}
    * @throws {UnexpectedEOF} always.
    */
    #unexpectedEOF() {
        throw new UnexpectedEOF(this.#reader.locate());
    }

    // #endregion

    // #region Helpers

    /**
     * Creates a new token.
     * @param {TokenType} tokenType The type of token to create.
     * @param {number} length The length of the token.
     * @param {Location} startLoc The start location for the token.
     * @param {Location} [endLoc] The end location for the token.
     * @returns {Token} The token.
     */
    #createToken(tokenType, length, startLoc, endLoc) {

        const endOffset = startLoc.offset + length;

        let range = this.#options.ranges ? {
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
     * Reads in a specific number of hex digits.
     * @param {number} count The number of hex digits to read.
     * @returns {string} The hex digits read.
     */
    #readHexDigits(count) {
        let value = "";
        let c;

        for (let i = 0; i < count; i++) {
            c = this.#reader.peek();
            if (isHexDigit(c)) {
                this.#reader.next();
                value += String.fromCharCode(c);
                continue;
            }

            this.#unexpected(c);
        }

        return value;
    }

    /**
     * Reads in a JSON5 identifier. Also used for JSON but we validate
     * the identifier later.
     * @param {number} c The first character of the identifier.
     * @returns {string} The identifier read.
     * @throws {UnexpectedChar} when the identifier cannot be read.
     */
    #readIdentifier(c) {
        let value = "";

        do {

            value += String.fromCharCode(c);

            if (c === charCodes.CHAR_BACKSLASH) {

                c = this.#reader.next();

                if (c !== charCodes.CHAR_LOWER_U) {
                    this.#unexpected(c);
                }

                value += String.fromCharCode(c);

                const hexDigits = this.#readHexDigits(4);

                // check for a valid character code
                const charCode = parseInt(hexDigits, 16);

                if (value.length === 2 && !isJSON5IdentifierStart(charCode)) {
                    const loc = this.#reader.locate();
                    this.#unexpected(charCodes.CHAR_BACKSLASH, { line: loc.line, column: loc.column - 5, offset: loc.offset - 5 });
                } else if (!isJSON5IdentifierPart(charCode)) {
                    const loc = this.#reader.locate();
                    this.#unexpected(charCode, { line: loc.line, column: loc.column - 5, offset: loc.offset - 5 });
                }

                value += hexDigits;
            }

            c = this.#reader.peek();

            if (!isJSON5IdentifierPart(c)) {
                break;
            }

            this.#reader.next();

        } while (true);  // eslint-disable-line no-constant-condition

        return value;
    }

    /**
     * Reads in a string. Works for both JSON and JSON5.
     * @param {number} c The first character of the string (either " or ').
     * @returns {number} The length of the string.
     * @throws {UnexpectedChar} when the string cannot be read.
     * @throws {UnexpectedEOF} when EOF is reached before the string is finalized.
     */
    #readString(c) {
        
        const delimiter = c;
        let length = 1;
        c = this.#reader.peek();

        while (c !== -1 && c !== delimiter) {

            this.#reader.next();
            length++;

            // escapes
            if (c === charCodes.CHAR_BACKSLASH) {
                c = this.#reader.peek();

                if (this.#isEscapedCharacter(c) || this.#isJSON5LineTerminator(c)) {
                    this.#reader.next();
                    length++;
                } else if (c === charCodes.CHAR_LOWER_U) {
                    this.#reader.next();
                    length++;

                    const result = this.#readHexDigits(4);
                    length += result.length;
                } else if (this.#isJSON5HexEscape(c)) {
                    this.#reader.next();
                    length++;

                    // hex escapes: \xHH
                    const result = this.#readHexDigits(2);
                    length += result.length;
                } else if (this.#json5) {  // JSON doesn't allow anything else
                    this.#reader.next();
                    length++;
                } else {
                    this.#unexpected(c);
                }
            }

            c = this.#reader.peek();
        }

        if (c === -1) {
            this.#reader.next();
            this.#unexpectedEOF();
        }

        // c is the delimiter
        this.#reader.next();
        length++;

        return length;
    
    
    }

    /**
     * Reads a number. Works for both JSON and JSON5.
     * @param {number} c The first character of the number.
     * @returns {number} The length of the number.
     * @throws {UnexpectedChar} when the number cannot be read.
     * @throws {UnexpectedEOF} when EOF is reached before the number is finalized.
     */
    #readNumber(c) {
        
        // we've already read the first character
        let length = 1;

        // JSON number may start with a minus but not a plus
        // JSON5 allows a plus.
        if (c === charCodes.CHAR_MINUS || this.#json5 && c === charCodes.CHAR_PLUS) {
            
            c = this.#reader.peek();
            
            /*
            * JSON5 allows Infinity or NaN preceded by a sign.
            * This blocks handles +Infinity, -Infinity, +NaN, and -NaN.
            * Standalone Infinity and NaN are handled in `readJSON5Identifier()`
            */
            if (this.#json5) {

                if (c === charCodes.CHAR_UPPER_I || c === charCodes.CHAR_UPPER_N) {
                    this.#reader.next();
                    const identifier = this.#readIdentifier(c);

                    if (identifier !== INFINITY && identifier !== NAN) {
                        this.#unexpected(c);
                    }

                    return length + identifier.length;
                }
            }

            // Next digit cannot be zero
            if (!isDigit(c)) {
                this.#unexpected(c);
            }

            // if we made it here, we need to continue on, so register the character
            this.#reader.next();
            length++;
        }

        /*
        * In JSON, a zero must be followed by a decimal point or nothing.
        * In JSON5, a zero can additionally be followed by an `x` indicating
        * that it's a hexadecimal number.
        */
        if (c === charCodes.CHAR_0) {

            // c = this.#reader.next();
            // length++;
            c = this.#reader.peek();

            // check for a hex number
            if (this.#json5 && (c === charCodes.CHAR_LOWER_X || c === charCodes.CHAR_UPPER_X)) {

                this.#reader.next();
                length++;

                c = this.#reader.peek();

                if (!isHexDigit(c)) {
                    this.#reader.next();
                    this.#unexpected(c);
                }

                do {
                    this.#reader.next();
                    length++;
                    c = this.#reader.peek();
                } while (isHexDigit(c));

            } else if (isDigit(c)) {
                this.#unexpected(c);
            }

        } else {

            // JSON5 allows leading decimal points
            if (!this.#json5 || c !== charCodes.CHAR_DOT) {
                if (!isPositiveDigit(c)) {
                    this.#unexpected(c);
                }

                c = this.#reader.peek();

                while (isDigit(c)) {
                    this.#reader.next();
                    length++;
                    c = this.#reader.peek();
                }
            }
        }

        /*
        * In JSON, a decimal point must be followed by at least one digit.
        * In JSON5, a decimal point need not be followed by any digits.
        */
        if (c === charCodes.CHAR_DOT) {
                                
            let digitCount = -1;
            this.#reader.next();
            length++;
            digitCount++;

            c = this.#reader.peek();

            while (isDigit(c)) {
                this.#reader.next();
                length++;
                digitCount++;
                c = this.#reader.peek();
            }

            if (!this.#json5 && digitCount === 0) {
                this.#reader.next();
                if (c) {
                    this.#unexpected(c);
                } else {
                    this.#unexpectedEOF();
                }
            }
        }

        // Exponent is always last
        if (c === charCodes.CHAR_LOWER_E || c === charCodes.CHAR_UPPER_E) {

            this.#reader.next();
            length++;
            c = this.#reader.peek();

            if (c === charCodes.CHAR_PLUS || c === charCodes.CHAR_MINUS) {
                this.#reader.next();
                length++;
                c = this.#reader.peek();
            }

            /*
            * Must always have a digit in this position to avoid:
            * 5e
            * 12E+
            * 42e-
            */
            if (c === -1) {
                this.#reader.next();
                this.#unexpectedEOF();
            }

            if (!isDigit(c)) {
                this.#reader.next();
                this.#unexpected(c);
            }

            while (isDigit(c)) {
                this.#reader.next();
                length++;
                c = this.#reader.peek();
            }
        }

        return length;
    }

    /**
     * Reads a comment. Works for both JSON and JSON5.
     * @param {number} c The first character of the comment.
     * @returns {{length: number, multiline: boolean}} The length of the comment, and whether the comment is multi-line.
     * @throws {UnexpectedChar} when the comment cannot be read.
     * @throws {UnexpectedEOF} when EOF is reached before the comment is finalized.
     */ 
    #readComment(c) {
        
        let length = 1;

        // next character determines single- or multi-line
        c = this.#reader.peek();

        // single-line comments
        if (c === charCodes.CHAR_SLASH) {
            
            do {
                this.#reader.next();
                length += 1;
                c = this.#reader.peek();
            } while (c > -1 && c !== charCodes.CHAR_RETURN && c !== charCodes.CHAR_NEWLINE);

            return { length, multiline: false };
        }

        // multi-line comments
        if (c === charCodes.CHAR_STAR) {

            this.#reader.next();
            length += 1;

            while (c > -1) {
                c = this.#reader.peek();

                // check for end of comment
                if (c === charCodes.CHAR_STAR) {
                    this.#reader.next();
                    length += 1;
                    c = this.#reader.peek();
                    
                    //end of comment
                    if (c === charCodes.CHAR_SLASH) {
                        this.#reader.next();
                        length += 1;

                        return { length, multiline: true };
                    }
                } else {
                    this.#reader.next();
                    length += 1;
                }
            }

            this.#reader.next();
            this.#unexpectedEOF();
            
        }

        // if we've made it here, there's an invalid character
        this.#reader.next();
        this.#unexpected(c);        
    }
    // #endregion

    /**
     * Returns the next token in the source text.
     * @returns {number} The code for the next token.
     */
    next() {

        let c = this.#reader.next();

        while (this.#isWhitespace(c)) {
            c = this.#reader.next();
        }

        if (c === -1) {
            return tt.EOF;
        }

        const start = this.#reader.locate();
        const ct = String.fromCharCode(c);

        // check for JSON5 syntax only
        if (this.#json5) {
                
            if (knownJSON5TokenTypes.has(ct)) {
                this.#token = this.#createToken(knownJSON5TokenTypes.get(ct), 1, start);
            } else if (isJSON5IdentifierStart(c)) {
                const value = this.#readIdentifier(c);

                if (knownJSON5TokenTypes.has(value)) {
                    this.#token = this.#createToken(knownJSON5TokenTypes.get(value), value.length, start);
                } else {
                    this.#token = this.#createToken("Identifier", value.length, start);
                }
            } else if (isJSON5NumberStart(c)) {
                const result = this.#readNumber(c);
                this.#token = this.#createToken("Number", result, start);
            } else if (isStringStart(c, this.#json5)) {
                const result = this.#readString(c);
                const lastCharLoc = this.#reader.locate();
                this.#token = this.#createToken("String", result, start, {
                    line: lastCharLoc.line,
                    column: lastCharLoc.column + 1,
                    offset: lastCharLoc.offset + 1
                });
            } else if (c === charCodes.CHAR_SLASH && this.#allowComments) {
                const result = this.#readComment(c);
                const lastCharLoc = this.#reader.locate();
                this.#token = this.#createToken(!result.multiline ? "LineComment" : "BlockComment", result.length, start, {
                    line: lastCharLoc.line,
                    column: lastCharLoc.column + 1,
                    offset: lastCharLoc.offset + 1
                });
            } else {
                this.#unexpected(c);
            }

        } else {

            // check for JSON/JSONC syntax only
            if (knownTokenTypes.has(ct)) {
                this.#token = this.#createToken(knownTokenTypes.get(ct), 1, start);
            } else if (isKeywordStart(c)) {
                const value = this.#readIdentifier(c);

                if (!jsonKeywords.has(value)) {
                    this.#unexpectedIdentifier(value, start);
                }

                this.#token = this.#createToken(knownTokenTypes.get(value), value.length, start);
            } else if (isNumberStart(c)) {
                const result = this.#readNumber(c);
                this.#token = this.#createToken("Number", result, start);
            } else if (isStringStart(c, this.#json5)) {
                const result = this.#readString(c);
                this.#token = this.#createToken("String", result, start);
            } else if (c === charCodes.CHAR_SLASH && this.#allowComments) {
                const result = this.#readComment(c);
                const lastCharLoc = this.#reader.locate();
                this.#token = this.#createToken(!result.multiline ? "LineComment" : "BlockComment", result.length, start, {
                    line: lastCharLoc.line,
                    column: lastCharLoc.column + 1,
                    offset: lastCharLoc.offset + 1
                });
            } else {
                this.#unexpected(c);
            }
        }
        return tt[this.#token.type];
    }

    /**
     * Returns the current token in the source text.
     * @returns {Token} The current token.
     */
    get token() {
        return this.#token;
    }
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

    const tokenizer = new Tokenizer(text, options);
    const tokens = [];

    while (tokenizer.next() !== tt.EOF) {
        tokens.push(tokenizer.token);
    }

    return tokens;

}
