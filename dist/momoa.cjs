'use strict';

/**
 * @fileoverview JSON syntax helpers
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Predefined Tokens
//-----------------------------------------------------------------------------

const LBRACKET = "[";
const RBRACKET = "]";
const LBRACE = "{";
const RBRACE = "}";
const COLON = ":";
const COMMA = ",";

const TRUE = "true";
const FALSE = "false";
const NULL = "null";

const QUOTE$1 = "\"";

const expectedKeywords = new Map([
    ["t", TRUE],
    ["f", FALSE],
    ["n", NULL]
]);

const escapeToChar = new Map([
    [QUOTE$1, QUOTE$1],
    ["\\", "\\"],
    ["/", "/"],
    ["b", "\b"],
    ["n", "\n"],
    ["f", "\f"],
    ["r", "\r"],
    ["t", "\t"]
]);

const knownTokenTypes = new Map([
    [LBRACKET, "LBracket"],
    [RBRACKET, "RBracket"],
    [LBRACE, "LBrace"],
    [RBRACE, "RBrace"],
    [COLON, "Colon"],
    [COMMA, "Comma"],
    [TRUE, "Boolean"],
    [FALSE, "Boolean"],
    [NULL, "Null"]
]);

/**
 * @fileoverview JSON tokenization/parsing errors
 * @author Nicholas C. Zakas
 */


/**
 * Base class that attaches location to an error.
 */
class ErrorWithLocation extends Error {

    /**
     * 
     * @param {string} message The error message to report. 
     * @param {int} loc.line The line on which the error occurred.
     * @param {int} loc.column The column in the line where the error occurrred.
     * @param {int} loc.index The index in the string where the error occurred.
     */
    constructor(message, { line, column, index }) {
        super(`${ message } (${ line }:${ column})`);

        /**
         * The line on which the error occurred.
         * @type int
         * @property line
         */
        this.line = line;

        /**
         * The column on which the error occurred.
         * @type int
         * @property column
         */
        this.column = column;
        
        /**
         * The index into the string where the error occurred.
         * @type int
         * @property index
         */
        this.index = index;
    }

}

/**
 * Error thrown when an unexpected character is found during tokenizing.
 */
class UnexpectedChar extends ErrorWithLocation {

    /**
     * Creates a new instance.
     * @param {string} unexpected The character that was found.
     * @param {Object} loc The location information for the found character.
     */
    constructor(unexpected, loc) {
        super(`Unexpected character ${ unexpected } found.`, loc);
    }
}

/**
 * Error thrown when an unexpected token is found during parsing.
 */
class UnexpectedToken extends ErrorWithLocation {

    /**
     * Creates a new instance.
     * @param {string} expected The character that was expected. 
     * @param {string} unexpected The character that was found.
     * @param {Object} loc The location information for the found character.
     */
    constructor(token) {
        super(`Unexpected token ${ token.type } found.`, token.loc.start);
    }
}

/**
 * Error thrown when the end of input is found where it isn't expected.
 */
class UnexpectedEOF extends ErrorWithLocation {

    /**
     * Creates a new instance.
     * @param {Object} loc The location information for the found character.
     */
    constructor(loc) {
        super("Unexpected end of input found.", loc);
    }
}

/**
 * @fileoverview JSON tokenizer
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

const QUOTE = "\"";
const SLASH = "/";
const STAR = "*";

const DEFAULT_OPTIONS$1 = {
    mode: "json"
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
function tokenize(text, options) {

    options = Object.freeze({
        ...DEFAULT_OPTIONS$1,
        ...options
    });

    let offset = -1;
    let line = 1;
    let column = 0;
    let newLine = false;

    const tokens = [];


    function createToken(tokenType, value, startLoc, endLoc) {
        
        const endOffset = startLoc.offset + value.length;
        
        return {
            type: tokenType,
            loc: {
                start: startLoc,
                end: endLoc || {
                    line: startLoc.line,
                    column: startLoc.column + value.length,
                    offset: endOffset
                }
            }
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

            /*
             * Must always have a digit in this position to avoid:
             * 5e
             * 12E+
             * 42e-
             */
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
        } else if (c === SLASH && options.mode === "jsonc") {
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

/**
 * @fileoverview Momoa JSON AST types
 * @author Nicholas C. Zakas
 */

const types = {
    document(body, parts = {}) {
        return {
            type: "Document",
            body,
            ...parts
        };
    },
    string(value, parts = {}) {
        return {
            type: "String",
            value,
            ...parts
        };
    },
    number(value, parts = {}) {
        return {
            type: "Number",
            value,
            ...parts
        };
    },
    boolean(value, parts = {}) {
        return {
            type: "Boolean",
            value,
            ...parts
        };
    },
    null(parts = {}) {
        return {
            type: "Null",
            value: "null",
            ...parts
        };
    },
    array(elements, parts = {}) {
        return {
            type: "Array",
            elements,
            ...parts
        };
    },
    element(value, parts = {}) {
        return {
            type: "Element",
            value,
            ...parts
        };
    },
    object(members, parts = {}) {
        return {
            type: "Object",
            members,
            ...parts
        };
    },
    member(name, value, parts = {}) {
        return {
            type: "Member",
            name,
            value,
            ...parts
        };
    },

};

/**
 * @fileoverview JSON parser
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

const DEFAULT_OPTIONS = {
    mode: "json"
};

/**
 * Converts a JSON-encoded string into a JavaScript string, interpreting each
 * escape sequence.
 * @param {string} value The text for the token.
 * @param {Token} token The string token to convert into a JavaScript string.
 * @returns {string} A JavaScript string.
 */
function getStringValue(value, token) {
    
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
                        offset: token.loc.start.offset + escapeIndex
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
                    offset: token.loc.start.offset + escapeIndex
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
 * @param {string} value The text value of the token.
 * @param {Token} token The JSON token to get a value for.
 * @returns {*} A number, string, boolean, or `null`. 
 */
function getLiteralValue(value, token) {
    switch (token.type) {
    case "Boolean":
        return value === "true";
        
    case "Number":
        return Number(value);

    case "Null":
        return null;

    case "String":
        return getStringValue(value.slice(1, -1), token);
    }
}

//-----------------------------------------------------------------------------
// Main Function
//-----------------------------------------------------------------------------

/**
 * 
 * @param {string} text The text to parse.
 * @param {Object} [options] The options object.
 * @param {string} [options.mode="json"] The parsing mode.
 * @returns {Object} The AST representing the parsed JSON.
 * @throws {Error} When there is a parsing error. 
 */
function parse(text, options) {

    options = Object.freeze({
        ...DEFAULT_OPTIONS,
        ...options
    });

    const tokens = tokenize(text, options);
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
    const next = options.mode === "jsonc" ? nextSkipComments : nextNoComments;

    function assertTokenType(token, type) {
        if (!token || token.type !== type) {
            throw new UnexpectedToken(token);
        }
    }

    function createLiteralNode(token) {

        return {
            type: token.type,
            value: getLiteralValue(
                text.slice(token.loc.start.offset, token.loc.end.offset),
                token
            ),
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


    function parseProperty(token) {
        assertTokenType(token, "String");
        const name = createLiteralNode(token);

        token = next();
        assertTokenType(token, "Colon");
        const value = parseValue();

        return types.member(name, value, {
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
        assertTokenType(firstToken, "LBrace");

        const members = [];
        let token = next();

        if (token && token.type !== "RBrace") {
            do {
    
                // add the value into the array
                members.push(parseProperty(token));
    
                token = next();
    
                if (token.type === "Comma") {
                    token = next();
                } else {
                    break;
                }
            } while (token);
        }

        assertTokenType(token, "RBrace");

        return types.object(members, {
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
        assertTokenType(firstToken, "LBracket");

        const elements = [];
        let token = next();
        
        if (token && token.type !== "RBracket") {

            do {

              // add the value into the array
              const value = parseValue(token);

              elements.push(types.element(
                value,
                { loc: value.loc }
              ));

              token = next();
              
              if (token.type === "Comma") {
                  token = next();
              } else {
                  break;
              }
            } while (token);
        }

        assertTokenType(token, "RBracket");

        return types.array(elements, {
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
    
    docParts.tokens = tokens;

    return types.document(docBody, docParts);

}

/**
 * @fileoverview Traversal approaches for Momoa JSON AST.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const childKeys = new Map([
    ["Document", ["body"]],
    ["Object", ["members"]],
    ["Member", ["name", "value"]],
    ["Element", ["value"]],
    ["Array", ["elements"]],
    ["String", []],
    ["Number", []],
    ["Boolean", []],
    ["Null", []]
]);

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/**
 * Determines if a given value is an object.
 * @param {*} value The value to check.
 * @returns {boolean} True if the value is an object, false if not. 
 */
function isObject(value) {
    return value && (typeof value === "object");
}

/**
 * Determines if a given value is an AST node.
 * @param {*} value The value to check.
 * @returns {boolean} True if the value is a node, false if not. 
 */
function isNode(value) {
    return isObject(value) && (typeof value.type === "string");
}

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * Traverses an AST from the given node.
 * @param {Node} root The node to traverse from 
 * @param {Object} visitor An object with an `enter` and `exit` method. 
 */
function traverse(root, visitor) {

    /**
     * Recursively visits a node.
     * @param {Node} node The node to visit.
     * @param {Node} parent The parent of the node to visit.
     * @returns {void}
     */
    function visitNode(node, parent) {

        if (typeof visitor.enter === "function") {
            visitor.enter(node, parent);
        }

        for (const key of childKeys.get(node.type)) {
            const value = node[key];

            if (isObject(value)) {
                if (Array.isArray(value)) {
                    value.forEach(child => visitNode(child, node));
                } else if (isNode(value)) {
                    visitNode(value, node);
                }
            }
        }

        if (typeof visitor.exit === "function") {
            visitor.exit(node, parent);
        }
    }

    visitNode(root);
}

/**
 * Creates an iterator over the given AST.
 * @param {Node} root The root AST node to traverse. 
 * @param {Function} [filter] A filter function to determine which steps to
 *      return;
 * @returns {Iterator} An iterator over the AST.  
 */
function iterator(root, filter = () => true) {

    const traversal = [];

    traverse(root, {
        enter(node, parent) {
            traversal.push({ node, parent, phase: "enter" });
        },
        exit(node, parent) {
            traversal.push({ node, parent, phase: "exit" });
        }
    });

    return traversal.filter(filter).values();
}

/**
 * @fileoverview Evaluator for Momoa AST.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * Evaluates a Momoa AST node into a JavaScript value.
 * @param {Node} node The node to interpet.
 * @returns {*} The JavaScript value for the node. 
 */
function evaluate(node) {
    switch (node.type) {
    case "String":
    case "Number":
    case "Boolean":
        return node.value;

    case "Null":
        return null;

    case "Array":
        return node.elements.map(evaluate);
    
    case "Element":
        return evaluate(node.value);

    case "Object": {

        const object = {};

        node.members.forEach(member => {
            object[evaluate(member.name)] = evaluate(member.value);
        });    

        return object;
    }    

    case "Document":
        return evaluate(node.body);

    case "Property":
        throw new Error("Cannot evaluate object property outside of an object.");

    default:
        throw new Error(`Unknown node type ${ node.type }.`);
    }
}

/**
 * @fileoverview Printer for Momoa AST.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * Converts a Momoa AST back into a JSON string.
 * @param {Node} node The node to print.
 * @param {int} [options.indent=0] The number of spaces to indent each line. If
 *      greater than 0, then newlines and indents will be added to output. 
 * @returns {string} The JSON representation of the AST.
 */
function print(node, { indent = 0 } = {}) {
    const value = evaluate(node);
    return JSON.stringify(value, null, indent);
}

exports.evaluate = evaluate;
exports.iterator = iterator;
exports.parse = parse;
exports.print = print;
exports.tokenize = tokenize;
exports.traverse = traverse;
exports.types = types;
