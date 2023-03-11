/**
 * @fileoverview Evaluator for Momoa AST.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Typedefs
//-----------------------------------------------------------------------------

/** @typedef {import("./momoa").MomoaNode} MomoaNode */
/** @typedef {import("./momoa").MomoaNodeParts} MomoaNodeParts */
/** @typedef {import("./momoa").MomoaDocumentNode} MomoaDocumentNode */
/** @typedef {import("./momoa").MomoaStringNode} MomoaStringNode */
/** @typedef {import("./momoa").MomoaNumberNode} MomoaNumberNode */
/** @typedef {import("./momoa").MomoaBooleanNode} MomoaBooleanNode */
/** @typedef {import("./momoa").MomoaMemberNode} MomoaMemberNode */
/** @typedef {import("./momoa").MomoaObjectNode} MomoaObjectNode */
/** @typedef {import("./momoa").MomoaElementNode} MomoaElementNode */
/** @typedef {import("./momoa").MomoaArrayNode} MomoaArrayNode */

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * Evaluates a Momoa AST node into a JavaScript value.
 * @param {MomoaNode} node The node to interpet.
 * @returns {*} The JavaScript value for the node. 
 */
export function evaluate(node) {
    switch (node.type) {
        case "String":
            const stringNode = /** @type {MomoaStringNode} */ (node);
            return stringNode.value;

        case "Number":
            const numberNode = /** @type {MomoaNumberNode} */ (node);
            return numberNode.value;

        case "Boolean":
            const booleanNode = /** @type {MomoaBooleanNode} */ (node);
            return booleanNode.value;

        case "Null":
            return null;

        case "Array":
            const arrayNode = /** @type {MomoaArrayNode} */ (node);
            return arrayNode.elements.map(element => evaluate(element.value));
        
        case "Object": {

            const objectNode = /** @type {MomoaObjectNode} */ (node);
            const object = {};

            objectNode.members.forEach(member => {
                object[evaluate(member.name)] = evaluate(member.value);
            });    

            return object;
        }    

        case "Document":
            const documentNode = /** @type {MomoaDocumentNode} */ (node);
            return evaluate(documentNode.body);

        case "Element":
            throw new Error("Cannot evaluate array element outside of an array.");

        case "Member":
            throw new Error("Cannot evaluate object member outside of an object.");

        default:
            throw new Error(`Unknown node type ${ node.type }.`);
    }
}
