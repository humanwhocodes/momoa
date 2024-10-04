/**
 * @fileoverview A charactor code reader.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Type Definitions
//-----------------------------------------------------------------------------

/** @typedef {import("./typedefs.ts").Location} Location */

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const CHAR_CR = 13; // \r
const CHAR_LF = 10; // \n

//-----------------------------------------------------------------------------
// CharCodeReader
//-----------------------------------------------------------------------------

/**
 * A reader that reads character codes from a string.
 */
export class CharCodeReader {

    /**
     * The text to read from.
     * @type {string}
     */
    #text = "";

    /**
     * The current line number.
     * @type {number}
     */
    #line = 1;

    /**
     * The current column number.
     * @type {number}
     */
    #column = 0;

    /**
     * The current offset in the text.
     * @type {number}
     */
    #offset = -1;

    /**
     * Whether the last character read was a new line.
     * @type {boolean}
     */
    #newLine = false;

    /**
     * The last character code read.
     * @type {number}
     */
    #last = -1;

    /**
     * Whether the reader has ended.
     * @type {boolean}
     */
    #ended = false;

    /**
     * Creates a new instance.
     * @param {string} text The text to read from
     */
    constructor(text) {
        this.#text = text;
    }

    /**
     * Ends the reader.
     * @returns {void}
     */
    #end() {
        if (this.#ended) {
            return;
        }

        this.#column++;
        this.#offset++;
        this.#last = -1;
        this.#ended = true;
    }

    /**
     * Returns the current position of the reader.
     * @returns {Location} An object with line, column, and offset properties.
     */
    locate() {
        return {
            line: this.#line,
            column: this.#column,
            offset: this.#offset
        };
    }

    /**
     * Reads the next character code in the text.
     * @returns {number} The next character code, or -1 if there are no more characters.
     */
    next() {
        if (this.#offset >= this.#text.length - 1) {
            this.#end();
            return -1;
        }

        this.#offset++;
        const charCode = this.#text.charCodeAt(this.#offset);

        if (this.#newLine) {
            this.#line++;
            this.#column = 1;
            this.#newLine = false;
        } else {
            this.#column++;
        }

        if (charCode === CHAR_CR) {
            this.#newLine = true;

            // if we already see a \r, just ignore upcoming \n
            if (this.peek() === CHAR_LF) {
                this.#offset++;
            }
        } else if (charCode === CHAR_LF) {
            this.#newLine = true;
        }

        this.#last = charCode;

        return charCode;
    }

    /**
     * Peeks at the next character code in the text.
     * @returns {number} The next character code, or -1 if there are no more characters.
     */
    peek() {
        if (this.#offset === this.#text.length - 1) {
            return -1;
        }

        return this.#text.charCodeAt(this.#offset + 1);
    }

    /**
     * Determines if the next character code in the text matches a specific character code.
     * @param {(number) => boolean} fn A function to call on the next character.
     * @returns {boolean} True if the next character code matches, false if not.
     */ 
    match(fn) {
        if (fn(this.peek())) {
            this.next();
            return true;
        }

        return false;
    }

    /**
     * Returns the last character code read.
     * @returns {number} The last character code read.
     */
    current() {
        return this.#last;
    }


}
