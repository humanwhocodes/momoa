/**
 * @fileoverview Traversal approaches for Momoa JSON AST.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Typedefs
//-----------------------------------------------------------------------------

/** @typedef {import("./typedefs.js").Node} Node */
/** @typedef {import("./typedefs.js").TraversalPhase} TraversalPhase */
/**
 * @typedef {Object} TraversalVisitor
 * @property {(node: Node, parent?: Node) => void} [enter]
 * @property {(node: Node, parent?: Node) => void} [exit]
 */

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

export const childKeys = new Map([
    ["Document", ["body"]],
    ["Object", ["members"]],
    ["Member", ["name", "value"]],
    ["Element", ["value"]],
    ["Array", ["elements"]],
    ["String", []],
    ["Number", []],
    ["Boolean", []],
    ["Null", []],
    ["NaN", []],
    ["Infinity", []],
    ["Identifier", []],
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
export function isNode(value) {
    return isObject(value) && (typeof value.type === "string");
}

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * Traverses an AST from the given node.
 * @param {Node} root The node to traverse from 
 * @param {TraversalVisitor} visitor An object with an `enter` and `exit` method. 
 */
export function traverse(root, visitor) {

    /**
     * Recursively visits a node.
     * @param {Node} node The node to visit.
     * @param {Node} [parent] The parent of the node to visit.
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
 * @callback FilterPredicate
 * @param {{node: Node, parent?: Node, phase: TraversalPhase}} item
 * @param {number} index
 * @param {Array<{node: Node, parent?: Node, phase: TraversalPhase}>} array
 * @returns {boolean}
 */

/**
 * Creates an iterator over the given AST.
 * @param {Node} root The root AST node to traverse. 
 * @param {FilterPredicate} [filter] A filter function to determine which steps to
 *      return;
 * @returns {IterableIterator<{node: Node, parent?: Node, phase: TraversalPhase}>} An iterator over the AST.  
 */
export function iterator(root, filter = () => true) {

    /** @type {Array<{node: Node, parent?: Node, phase: TraversalPhase}>} */
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
