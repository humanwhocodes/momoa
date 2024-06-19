/**
 * @fileoverview Printer for Momoa AST.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { evaluate } from "./evaluate.js";

//-----------------------------------------------------------------------------
// Typedefs
//-----------------------------------------------------------------------------

/** @typedef {import("./typedefs").Location} Location */
/** @typedef {import("./typedefs").AnyNode} AnyNode */

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
    const value = evaluate(node);
    return JSON.stringify(value, null, indent);
}
