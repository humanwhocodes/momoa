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

export const tokenTypes = {
    [LBRACKET]: "LBRACKET",
    [RBRACKET]: "RBRACKET",
    [LBRACE]: "LBRACE",
    [RBRACE]: "RBRACE",
    [COLON]: "COLON",
    [COMMA]: "COMMA",
    [TRUE]: "TRUE",
    [FALSE]: "FALSE",
    [NULL]: "NULL"
};

const states = {
    DEFAULT: 0,
    NULL: 1,
    BOOLEAN: 2,
    NUMBER: 3,
    STRING: 4,
    ARRAY: 5,
    OBJECT: 6
};

function isDigit(c) {
    return c >= "0" && c <= "9";
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

    let i = -1;
    let line = 1;
    let column = 0;


    function createToken(tokenType, value, startRange = i) {
        return {
            type: tokenType,
            value,
            range: [startRange, startRange + value.length],
            loc: {
                start: { line, column },
                end: { line, column: column + value.length }
            }
        };
    }

    function next() {
        let c = text.charAt(++i);
        column++;

        if (c === "\n") {
            line++;
            column = 0;
        }
    
        return c;
    }

    function readKeyword(c) {
        
        // get the expected keyword
        let value = keywordStarts[c];

        // check to see if it actually exists
        if (text.slice(i, i + value.length) === value) {
            i += value.length;
            column += value.length;
            return value;
        }

        // find the first unexpected character
        for (let j = 1; j < value.length; j++) {
            if (value[j] !== text.charAt(i + j)) {
                unexpected(next());
            }
        }

    }
    
    function unexpected(c) {
        throw new Error(`Unexpected character ${ c } at ${ line }:${ column }`);
    }



    while (i < text.length) {

        let c = next();
        
        // check for easy case
        if (c in tokenTypes) {
            const token = createToken(tokenTypes[c], c);
            token.loc.start.line = line;
            token.loc.start.column = column;
            token.loc.end.line = line;
            token.loc.end.column = column + 1;

            yield token;
        } else if (isKeywordStart(c)) {
            const startIndex = i;
            const startLine = line;
            const startColumn = column;
            const value = readKeyword(c);
            const token = createToken(tokenTypes[value], value, startIndex);
            token.loc.start.line = startLine;
            token.loc.start.column = startColumn;
            token.loc.end.line = line;
            token.loc.end.column = column + 1;

        }
    }




}