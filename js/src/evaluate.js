/**
 * @fileoverview Evaluator for Momoa AST.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Typedefs
//-----------------------------------------------------------------------------

/** @typedef {import("./typedefs.js").Node} Node */
/** @typedef {import("./typedefs.js").NodeParts} NodeParts */
/** @typedef {import("./typedefs.js").DocumentNode} DocumentNode */
/** @typedef {import("./typedefs.js").StringNode} StringNode */
/** @typedef {import("./typedefs.js").NumberNode} NumberNode */
/** @typedef {import("./typedefs.js").BooleanNode} BooleanNode */
/** @typedef {import("./typedefs.js").MemberNode} MemberNode */
/** @typedef {import("./typedefs.js").ObjectNode} ObjectNode */
/** @typedef {import("./typedefs.js").ElementNode} ElementNode */
/** @typedef {import("./typedefs.js").ArrayNode} ArrayNode */
/** @typedef {import("./typedefs.js").NullNode} NullNode */
/** @typedef {import("./typedefs.js").AnyNode} AnyNode */
/** @typedef {import("./typedefs.js").JSONValue} JSONValue */

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * Evaluates a Momoa AST node into a JavaScript value.
 * @param {AnyNode} node The node to interpet.
 * @returns {JSONValue} The JavaScript value for the node. 
 */
export function evaluate(node) {
    switch (node.type) {
        case "String":
            return node.value;

        case "Number":
            return node.value;

        case "Boolean":
            return node.value;

        case "Null":
            return null;

        case "NaN":
            return NaN;
        
        case "Infinity":
            return node.sign === "-" ? -Infinity : Infinity;

        case "Identifier":
            return node.name;

        case "Array": {
            // const arrayNode = /** @type {ArrayNode} */ (node);
            return node.elements.map(element => evaluate(element.value));
        }

        case "Object": {

            /** @type {{[property: string]: JSONValue}} */
            const object = {};

            node.members.forEach(member => {
                object[/** @type {string} */ (evaluate(member.name))] = evaluate(member.value);
            });    

            return object;
        }    

        case "Document": {
            return evaluate(node.body);
        }

        case "Element":
            throw new Error("Cannot evaluate array element outside of an array.");

        case "Member":
            throw new Error("Cannot evaluate object member outside of an object.");

        default:
            // @ts-ignore tsc doesn't know about the type property here?
            throw new Error(`Unknown node type ${ node.type }.`);
    }
}
