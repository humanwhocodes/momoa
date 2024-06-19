/**
 * @fileoverview JSON tokenization/parsing errors
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Typedefs
//-----------------------------------------------------------------------------

/** @typedef {import("./typedefs").Location} Location */
/** @typedef {import("./typedefs").Token} Token */

//-----------------------------------------------------------------------------
// Errors
//-----------------------------------------------------------------------------

/**
 * Base class that attaches location to an error.
 */
export class ErrorWithLocation extends Error {

    /**
     * Creates a new instance.
     * @param {string} message The error message to report. 
     * @param {Location} loc The location information for the error.
     */
    constructor(message, { line, column, offset }) {
        super(`${ message } (${ line }:${ column})`);

        /**
         * The line on which the error occurred.
         * @type {number}
         */
        this.line = line;

        /**
         * The column on which the error occurred.
         * @type {number}
         */
        this.column = column;
        
        /**
         * The index into the string where the error occurred.
         * @type {number}
         */
        this.offset = offset;
    }

}

/**
 * Error thrown when an unexpected character is found during tokenizing.
 */
export class UnexpectedChar extends ErrorWithLocation {

    /**
     * Creates a new instance.
     * @param {string} unexpected The character that was found.
     * @param {Location} loc The location information for the found character.
     */
    constructor(unexpected, loc) {
        super(`Unexpected character '${ unexpected }' found.`, loc);
    }
}

/**
 * Error thrown when an unexpected token is found during parsing.
 */
export class UnexpectedToken extends ErrorWithLocation {

    /**
     * Creates a new instance.
     * @param {Token} token The token that was found. 
     */
    constructor(token) {
        super(`Unexpected token ${ token.type } found.`, token.loc.start);
    }
}

/**
 * Error thrown when the end of input is found where it isn't expected.
 */
export class UnexpectedEOF extends ErrorWithLocation {

    /**
     * Creates a new instance.
     * @param {Location} loc The location information for the found character.
     */
    constructor(loc) {
        super("Unexpected end of input found.", loc);
    }
}
