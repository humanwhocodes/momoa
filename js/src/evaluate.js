/**
 * @fileoverview Evaluator for Momoa AST.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Typedefs
//-----------------------------------------------------------------------------

/** @typedef {import("./typedefs").Node} Node */
/** @typedef {import("./typedefs").NodeParts} NodeParts */
/** @typedef {import("./typedefs").DocumentNode} DocumentNode */
/** @typedef {import("./typedefs").StringNode} StringNode */
/** @typedef {import("./typedefs").NumberNode} NumberNode */
/** @typedef {import("./typedefs").BooleanNode} BooleanNode */
/** @typedef {import("./typedefs").MemberNode} MemberNode */
/** @typedef {import("./typedefs").ObjectNode} ObjectNode */
/** @typedef {import("./typedefs").ElementNode} ElementNode */
/** @typedef {import("./typedefs").ArrayNode} ArrayNode */
/** @typedef {import("./typedefs").NullNode} NullNode */
/** @typedef {import("./typedefs").AnyNode} AnyNode */
/** @typedef {import("./typedefs").JSONValue} JSONValue */

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
