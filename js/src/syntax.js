/**
 * @fileoverview JSON syntax helpers
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import * as charCodes from "./char-codes.js";

//-----------------------------------------------------------------------------
// Types
//-----------------------------------------------------------------------------

/** @typedef {import("./typedefs.ts").TokenType} TokenType */

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
    [charCodes.CHAR_LOWER_T, [charCodes.CHAR_LOWER_R, charCodes.CHAR_LOWER_U, charCodes.CHAR_LOWER_E]],
    [charCodes.CHAR_LOWER_F, [charCodes.CHAR_LOWER_A, charCodes.CHAR_LOWER_L, charCodes.CHAR_LOWER_S, charCodes.CHAR_LOWER_E]],
    [charCodes.CHAR_LOWER_N, [charCodes.CHAR_LOWER_U, charCodes.CHAR_LOWER_L, charCodes.CHAR_LOWER_L]]
]);

export const escapeToChar = new Map([
    [charCodes.CHAR_DOUBLE_QUOTE, QUOTE],
    [charCodes.CHAR_BACKSLASH, "\\"],
    [charCodes.CHAR_SLASH, "/"],
    [charCodes.CHAR_LOWER_B, "\b"],
    [charCodes.CHAR_LOWER_N, "\n"],
    [charCodes.CHAR_LOWER_F, "\f"],
    [charCodes.CHAR_LOWER_R, "\r"],
    [charCodes.CHAR_LOWER_T, "\t"]
]);

export const json5EscapeToChar = new Map([
    ...escapeToChar,
    [charCodes.CHAR_LOWER_V, "\v"],
    [charCodes.CHAR_0, "\0"]
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
    charCodes.CHAR_NEWLINE,
    charCodes.CHAR_RETURN,
    charCodes.CHAR_LINE_SEPARATOR,
    charCodes.CHAR_PARAGRAPH_SEPARATOR
]);
