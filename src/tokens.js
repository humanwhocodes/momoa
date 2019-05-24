/**
 * @fileoverview JSON tokenizer
 * @author Nicholas C. Zakas
 */

const LBRACKET = "[";
const RBRACKET = "]";
const LBRACE = "{";
const RBRACE = "}";
const COLON = ":";
const COMMA = ",";

const TRUE = "true";
const FALSE = "false";
const NULL = "null";

const QUOTE = "\"";

export const keywords = [
    TRUE,
    FALSE,
    NULL
];

const keywordStarts = {
    "t": TRUE,
    "f": FALSE,
    "n": NULL
};

export const escapes = new Map([
    ["\"", "\""],
    ["\\", "\\"],
    ["\/", "/"],
    ["b", "\b"],
    ["n", "\n"],
    ["f", "\f"],
    ["r", "\r"],
    ["t", "\t"]
]);

export const tokenTypes = {
    [LBRACKET]: "Punctuator",
    [RBRACKET]: "Punctuator",
    [LBRACE]: "Punctuator",
    [RBRACE]: "Punctuator",
    [COLON]: "Punctuator",
    [COMMA]: "Punctuator",
    [TRUE]: "Boolean",
    [FALSE]: "Boolean",
    [NULL]: "Null"
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

export function* tokens(text) {

    // normalize line endings
    text = text.replace(/\n\r?/g, "\n");

    let index = -1;
    let line = 1;
    let column = 0;


    function createToken(tokenType, value, startLoc) {
        return {
            type: tokenType,
            value,
            loc: {
                start: startLoc,
                end: {
                    line: startLoc.line,
                    column: startLoc.column + value.length,
                    index: startLoc.index + value.length
                }
            }
        };
    }

    function next() {
        let c = text.charAt(++index);
        column++;

        if (c === "\r") {
            line++;
            column = 0;

            // if we already see a \r, just ignore upcoming \n
            if (text.charAt(index + 1) === "\n") {
                index++;
            }
        } else if (c === "\n") {
            line++;
            column = 0;
        }
    
        return c;
    }

    function peek() {
        return text.charAt(index + 1);
    }

    function locate() {
        return {
            line,
            column,
            index
        };
    }

    function nextNonWhitespace() {
        
        let c;

        do {
            c = next();
        } while (isWhitespace(c));

        return c;
    }

    function readKeyword(c) {
        
        // get the expected keyword
        let value = keywordStarts[c];

        // check to see if it actually exists
        if (text.slice(index, index + value.length) === value) {
            index += value.length - 1;
            column += value.length - 1;
            return { value, c: next() };
        }

        // find the first unexpected character
        for (let j = 1; j < value.length; j++) {
            if (value[j] !== text.charAt(index + j)) {
                unexpected(next());
            }
        }

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

    function readString(c) {
        let value = c;
        c = next();

        while (c !== QUOTE) {

            // escapes
            if (c === "\\") {
                value += c;
                c = next();

                if (escapes.has(c)) {
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

        value += c;

        return { value, c: next() };
    }
    
    function unexpected(c) {
        throw new Error(`Unexpected character ${ c } at ${ line }:${ column }`);
    }


    let c = next();

    while (index < text.length) {

        while (isWhitespace(c)) {
            c = next();
        }

        if (!c) {
            break;
        }

        const start = locate();
        
        // check for easy case
        if (c in tokenTypes) {
            yield createToken(tokenTypes[c], c, start);
            c = next();
        } else if (isKeywordStart(c)) {
            const result = readKeyword(c);
            let value = result.value;
            c = result.c;
            yield createToken(tokenTypes[value], value, start);
        } else if (isNumberStart(c)) {
            const result = readNumber(c);
            let value = result.value;
            c = result.c;
            yield createToken("Number", value, start);
        } else if (c === "\"") {
            const result = readString(c);
            let value = result.value;
            c = result.c;
            yield createToken("String", value, start);
        } else {
            unexpected(c);
        }
    }

}