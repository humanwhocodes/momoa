/**
 * @fileoverview Interpreter for Momoa AST.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * Interpets a Momoa AST node into a JavaScript value.
 * @param {Node} node The node to interpet.
 * @returns {*} The JavaScript value for the node. 
 */
export function interpret(node) {
    switch (node.type) {
        case "String":
        case "Number":
        case "Boolean":
            return node.value;

        case "Null":
            return null;

        case "Array":
            return node.items.map(interpret);

        case "Object": {

            const object = {};

            node.body.forEach(property => {
                object[interpret(property.name)] = interpret(property.value);
            });    

            return object;
        }    

        case "Document":
            return interpret(node.body);

        case "Property":
            throw new Error(`Cannot evaluate object property outside of an object.`);

        default:
            throw new Error(`Unknown node type ${ node.type }.`);
    }
}
