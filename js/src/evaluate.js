/**
 * @fileoverview Evaluator for Momoa AST.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Typedefs
//-----------------------------------------------------------------------------

/** @typedef {import("./typings").Node} Node */
/** @typedef {import("./typings").NodeParts} NodeParts */
/** @typedef {import("./typings").DocumentNode} DocumentNode */
/** @typedef {import("./typings").StringNode} StringNode */
/** @typedef {import("./typings").NumberNode} NumberNode */
/** @typedef {import("./typings").BooleanNode} BooleanNode */
/** @typedef {import("./typings").MemberNode} MemberNode */
/** @typedef {import("./typings").ObjectNode} ObjectNode */
/** @typedef {import("./typings").ElementNode} ElementNode */
/** @typedef {import("./typings").ArrayNode} ArrayNode */
/** @typedef {import("./typings").NullNode} NullNode */
/** @typedef {import("./typings").AnyNode} AnyNode */
/** @typedef {import("./typings").JSONValue} JSONValue */

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
