/**
 * @fileoverview Evaluator for Momoa AST.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * Evaluates a Momoa AST node into a JavaScript value.
 * @param {Node} node The node to interpet.
 * @returns {*} The JavaScript value for the node. 
 */
export function evaluate(node) {
    switch (node.type) {
    case "String":
    case "Number":
    case "Boolean":
        return node.value;

    case "Null":
        return null;

    case "Array":
        return node.elements.map(evaluate);

    case "Object": {

        const object = {};

        node.members.forEach(member => {
            object[evaluate(member.name)] = evaluate(member.value);
        });    

        return object;
    }    

    case "Document":
        return evaluate(node.body);

    case "Property":
        throw new Error("Cannot evaluate object property outside of an object.");

    default:
        throw new Error(`Unknown node type ${ node.type }.`);
    }
}
