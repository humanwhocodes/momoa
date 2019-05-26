/**
 * @fileoverview Iterator for Momoa JSON AST.
 * @author Nicholas C. Zakas
 */


//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const childKeys = new Map([
    ["Document", ["body"]],
    ["Object", ["body"]],
    ["Property", ["name", "value"]],
    ["Array", ["items"]],
    ["String",[]],
    ["Number",[]],
    ["Boolean",[]],
    ["Null",[]]
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
 * Creates an iterator over the given AST.
 * @param {Node} root The root AST node to traverse. 
 * @param {Function} [filter] A filter function to determine which steps to
 *      return;
 * @returns {Iterator} An iterator over the AST.  
 */
export function* iterator(root, filter = () => true) {

    /**
     * A function to be called recursively to traverse the AST. 
     * @param {Node} node The node to visit.
     * @param {Node} parent The parent of the node to visit.
     * @param {string} parentKey The key in the parent where the node can be found.
     * @param {boolean} inArray If the node is found within an array.
     * @param {int} arrayIndex The index in the array where the node can be found.
     */
    function* traverseTree(node, parent, parentKey = undefined, inArray = false, arrayIndex = -1) {

        const enterStep = {
            node,
            parent,
            parentKey,
            inArray,
            arrayIndex,
            phase: "enter"
        };

        if (filter(enterStep)) {
            yield enterStep;
        }

        for (const key of childKeys.get(node.type)) {
            const value = node[key];

            if (isObject(value)) {
                if (Array.isArray(value)) {
                    let i = 0;
                    for (const item of value) {
                        yield* traverseTree(item, node, key, true, i++);
                    }
                } else if (isNode(value)) {
                    yield* traverseTree(value, node, key, false);
                }
            }
        }

        const exitStep = {
            ...enterStep,
            phase: "exit"
        };

        if (filter(exitStep)) {
            yield exitStep;
        }
    }

    yield* traverseTree(root);
}