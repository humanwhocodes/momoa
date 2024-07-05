/**
 * @fileoverview JSON syntax helpers
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Types
//-----------------------------------------------------------------------------

/** @typedef {import("./typedefs").TokenType} TokenType */

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
const NAN = "NaN";
const INFINITY = "Infinity";
const QUOTE = "\"";

//-----------------------------------------------------------------------------
// Token Collections
//-----------------------------------------------------------------------------

export const keywords = [
    TRUE,
    FALSE,
    NULL
];

export const json5Keywords = [
    "Infinity",
    "NaN",
    "undefined",
    ...keywords
];

export const json5HexDigits = new Set([
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F"
]);

export const expectedKeywords = new Map([
    ["t", TRUE],
    ["f", FALSE],
    ["n", NULL]
]);

export const escapeToChar = new Map([
    [QUOTE, QUOTE],
    ["\\", "\\"],
    ["/", "/"],
    ["b", "\b"],
    ["n", "\n"],
    ["f", "\f"],
    ["r", "\r"],
    ["t", "\t"]
]);

export const json5EscapeToChar = new Map([
    ...escapeToChar,
    ["v", "\v"],
    ["0", "\0"]
]);

export const charToEscape = new Map([
    [QUOTE, QUOTE],
    ["\\", "\\"],
    ["/", "/"],
    ["\b", "b"],
    ["\n", "n"],
    ["\f", "f"],
    ["\r", "r"],
    ["\t", "t"]
]);

export const json5CharToEscape = new Map([
    ...charToEscape,
    ["\v", "v"],
    ["\0", "0"],
    ["\u2028", "u2028"],
    ["\u2029", "u2029"]
]);

/** @type {Map<string,TokenType>} */
export const knownTokenTypes = new Map([
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

/** @type {Map<string,TokenType>} */
export const knownJSON5TokenTypes = new Map([
    ...knownTokenTypes,
    [NAN, "Number"],
    [INFINITY, "Number"]
]);

// JSON5
export const json5LineTerminators = new Set([
    "\n",
    "\r",
    "\u2028",
    "\u2029"
]);
