/**
 * @fileoverview Printer for Momoa AST.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { json5CharToEscape } from "./syntax.js";

//-----------------------------------------------------------------------------
// Typedefs
//-----------------------------------------------------------------------------

/** @typedef {import("./typedefs.ts").Location} Location */
/** @typedef {import("./typedefs.ts").AnyNode} AnyNode */
/** @typedef {import("./typedefs.ts").BooleanNode} BooleanNode */
/** @typedef {import("./typedefs.ts").NumberNode} NumberNode */
/** @typedef {import("./typedefs.ts").NullNode} NullNode */
/** @typedef {import("./typedefs.ts").NaNNode} NaNNode */
/** @typedef {import("./typedefs.ts").InfinityNode} InfinityNode */
/** @typedef {import("./typedefs.ts").StringNode} StringNode */
/** @typedef {import("./typedefs.ts").IdentifierNode} IdentifierNode */
/** @typedef {import("./typedefs.ts").ObjectNode} ObjectNode */
/** @typedef {import("./typedefs.ts").ArrayNode} ArrayNode */
/** @typedef {import("./typedefs.ts").MemberNode} MemberNode */

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/**
 * Prints the string representation of a Boolean node.
 * @param {BooleanNode} node The node to print.
 * @returns {string} The boolean value.
 */
function printBoolean(node) {
    return node.value ? "true" : "false";
}

/**
 * Prints the string representation of a null node.
 * @returns {string} The string "null".
 */
function printNull() {
    return "null";
}

/**
 * Prints the string representation of a number node.
 * @param {NumberNode} node The node to print.
 * @returns {string} The number value.
 */
function printNumber(node) {
    return node.value.toString();
}

/**
 * Prints the string representation of a NaN node.
 * @returns {string} The string "NaN".
 */
function printNaN() {
    return "NaN";
}

/**
 * Prints the string representation of an Infinity node.
 * @param {InfinityNode} node The node to print.
 * @returns {string} The string "Infinity" or "-Infinity".
 */
function printInfinity(node) {
    return node.sign + "Infinity";
}

/**
 * Prints the string representation of a string node.
 * @param {StringNode} node The node to print.
 * @returns {string} The string value.
 */
function printString(node) {

    let result = "\"";

    // escape all characters that need escaping
    for (const c of node.value) {

        const newChar = json5CharToEscape.get(c);

        if (newChar) {
            result += "\\" + newChar;
            continue;
        }

        // if it's a double quote, escape it
        if (c === "\"") {
            result += "\\\"";
            continue;
        }

        // if it's a control character, escape it
        if (c < " " || c === "\u007F") {
            const hex = c.codePointAt(0).toString(16).toUpperCase();
            result += `\\u${"0000".substring(hex.length)}${hex}`;
            continue;
        }

        // otherwise, just add the character
        result += c;

    }
    
    return result + "\"";
}

/**
 * Prints the string representation of an identifier node.
 * @param {IdentifierNode} node The node to print.
 * @returns {string} The identifier name.
 */
function printIdentifier(node) {
    return node.name;
}

/**
 * Prints the string representation of an array node.
 * @param {ArrayNode} node The node to print.
 * @param {string} indent The string to use for indentation.
 * @param {number} indentLevel The current level of indentation.
 * @returns {string} The array value.
 */
function printArray(node, indent, indentLevel) {
    const newLine = indent ? "\n" : "";
    const indentString = indent.repeat(indentLevel);
    const elementIndentString = indent.repeat(indentLevel + 1);

    return `[${newLine}${
        node.elements.map(element =>
            `${elementIndentString}${printValue(element.value, indent, indentLevel + 1)}`
        ).join(`,${newLine}`)
    }${newLine}${indentString}]`;
}

/**
 * Prints the string representation of a member node.
 * @param {MemberNode} node The node to print.
 * @param {string} indent The string to use for indentation.
 * @param {number} indentLevel The current level of indentation.
 * @returns {string} The member value.
 */
function printMember(node, indent, indentLevel) {
    const space = indent ? " " : "";
    return `${printValue(node.name, indent, indentLevel)}:${space}${printValue(node.value, indent, indentLevel + 1)}`;
}

/**
 * Prints the string representation of an object node.
 * @param {ObjectNode} node The node to print.
 * @param {string} indent The string to use for indentation.
 * @param {number} indentLevel The current level of indentation.
 * @returns {string} The object value.
 */
function printObject(node, indent, indentLevel) {
    const newLine = indent ? "\n" : "";
    const indentString = indent.repeat(indentLevel);
    const memberIndentString = indent.repeat(indentLevel + 1);

    return `{${newLine}${
        node.members.map(member => 
            `${memberIndentString}${printMember(member, indent, indentLevel)}`
        ).join(`,${newLine}`)
    }${newLine}${indentString}}`;
}

/**
 * Prints the string representation of a node.
 * @param {AnyNode} node The node to print.
 * @param {string} indentString The string to use for indentation.
 * @param {number} indentLevel The current level of indentation.
 * @returns {string} The string representation of the node.
 * @throws {TypeError} If the node type is unknown.

 */
function printValue(node, indentString, indentLevel) {
    switch (node.type) {
        case "String":
            return printString(node);
        case "Number":
            return printNumber(node);
        case "Boolean":
            return printBoolean(node);
        case "Null":
            return printNull();
        case "NaN":
            return printNaN();
        case "Infinity":
            return printInfinity(node);
        case "Identifier":
            return printIdentifier(node);
        case "Array":
            return printArray(node, indentString, indentLevel);
        case "Object":
            return printObject(node, indentString, indentLevel);
        case "Document":
            return printValue(node.body, indentString, indentLevel);
        default:
            throw new TypeError(`Unknown node type: ${node.type}`);
    }
}


//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * Converts a Momoa AST back into a JSON string.
 * @param {AnyNode} node The node to print.
 * @param {Object} options Options for the print.
 * @param {number} [options.indent=0] The number of spaces to indent each line. If
 *      greater than 0, then newlines and indents will be added to output. 
 * @returns {string} The JSON representation of the AST.
 */
export function print(node, { indent = 0 } = {}) {

    const indentLevel = 0;
    const indentString = " ".repeat(indent);

    return printValue(node, indentString, indentLevel);
}
