/**
 * @fileoverview Evaluator for Momoa AST.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Typedefs
//-----------------------------------------------------------------------------

/** @typedef {import("./momoa").Node} Node */
/** @typedef {import("./momoa").NodeParts} NodeParts */
/** @typedef {import("./momoa").DocumentNode} DocumentNode */
/** @typedef {import("./momoa").StringNode} StringNode */
/** @typedef {import("./momoa").NumberNode} NumberNode */
/** @typedef {import("./momoa").BooleanNode} BooleanNode */
/** @typedef {import("./momoa").MemberNode} MemberNode */
/** @typedef {import("./momoa").ObjectNode} ObjectNode */
/** @typedef {import("./momoa").ElementNode} ElementNode */
/** @typedef {import("./momoa").ArrayNode} ArrayNode */
/** @typedef {import("./momoa").NullNode} NullNode */
/** @typedef {import("./momoa").JSONValue} JSONValue */

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * Evaluates a Momoa AST node into a JavaScript value.
 * @param {Node} node The node to interpet.
 * @returns {JSONValue} The JavaScript value for the node. 
 */
export function evaluate(node) {
    switch (node.type) {
        case "String": {
            const stringNode = /** @type {StringNode} */ (node);
            return stringNode.value;
        }

        case "Number": {
            const numberNode = /** @type {NumberNode} */ (node);
            return numberNode.value;
        }
        
        case "Boolean": {
            const booleanNode = /** @type {BooleanNode} */ (node);
            return booleanNode.value;
        }

        case "Null":
            return null;

        case "Array": {
            const arrayNode = /** @type {ArrayNode} */ (node);
            return arrayNode.elements.map(element => evaluate(element.value));
        }

        case "Object": {

            const objectNode = /** @type {ObjectNode} */ (node);

            /** @type {{[property: string]: JSONValue}} */
            const object = {};

            objectNode.members.forEach(member => {
                object[/** @type {string} */ (evaluate(member.name))] = evaluate(member.value);
            });    

            return object;
        }    

        case "Document": {
            const documentNode = /** @type {DocumentNode} */ (node);
            return evaluate(documentNode.body);
        }

        case "Element":
            throw new Error("Cannot evaluate array element outside of an array.");

        case "Member":
            throw new Error("Cannot evaluate object member outside of an object.");

        default:
            throw new Error(`Unknown node type ${ node.type }.`);
    }
}
