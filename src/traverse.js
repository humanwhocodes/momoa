/**
 * @fileoverview Traversal for Momoa JSON AST
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { iterator } from "./iterator.js";

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

const defaultVisitor = {
    enter() {},
    exit() {}
};

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * Traverses an AST from the given node.
 * @param {Node} root The node to traverse from 
 * @param {Object} visitor An object with an `enter` and `exit` method. 
 */
export function traverse(root, visitor = defaultVisitor) {
    for (const { node, parent, phase } of iterator(root)) {
        visitor[phase](node, parent);
    }
}