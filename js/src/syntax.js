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

const QUOTE = "\"";

//-----------------------------------------------------------------------------
// Token Collections
//-----------------------------------------------------------------------------

export const keywords = [
    TRUE,
    FALSE,
    NULL
];

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
