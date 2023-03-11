/**
 * @fileoverview Momoa JSON AST types
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Typedefs
//-----------------------------------------------------------------------------

/** @typedef {import("./momoa").MomoaLocation} MomoaLocation */
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

export const types = {

    /**
     * Creates a document node.
     * @param {MomoaNode} body The body of the document.
     * @param {MomoaNodeParts} parts Additional properties for the node. 
     * @returns {MomoaDocumentNode} The document node.
     */
    document(body, parts = {}) {
        return {
            type: "Document",
            body,
            ...parts
        };
    },

    /**
     * Creates a string node.
     * @param {string} value The value for the string.
     * @param {MomoaNodeParts} parts Additional properties for the node. 
     * @returns {MomoaStringNode} The string node.
     */
    string(value, parts = {}) {
        return {
            type: "String",
            value,
            ...parts
        };
    },

    /**
     * Creates a number node.
     * @param {number} value The value for the number.
     * @param {MomoaNodeParts} parts Additional properties for the node. 
     * @returns {MomoaNumberNode} The number node.
     */
    number(value, parts = {}) {
        return {
            type: "Number",
            value,
            ...parts
        };
    },

    /**
     * Creates a boolean node.
     * @param {boolean} value The value for the boolean.
     * @param {MomoaNodeParts} parts Additional properties for the node. 
     * @returns {MomoaBooleanNode} The boolean node.
     */
    boolean(value, parts = {}) {
        return {
            type: "Boolean",
            value,
            ...parts
        };
    },

    /**
     * Creates a null node.
     * @param {MomoaNodeParts} parts Additional properties for the node. 
     * @returns {MomoaNode} The null node.
     */
    null(parts = {}) {
        return {
            type: "Null",
            ...parts
        };
    },

    /**
     * Creates an array node.
     * @param {Array<MomoaElementNode>} elements The elements to add.
     * @param {MomoaNodeParts} parts Additional properties for the node. 
     * @returns {MomoaArrayNode} The array node.
     */
    array(elements, parts = {}) {
        return {
            type: "Array",
            elements,
            ...parts
        };
    },

    /**
     * Creates an element node.
     * @param {MomoaNode} value The value for the element.
     * @param {MomoaNodeParts} parts Additional properties for the node. 
     * @returns {MomoaElementNode} The element node.
     */
    element(value, parts = {}) {
        return {
            type: "Element",
            value,
            ...parts
        };
    },

    /**
     * Creates an object node.
     * @param {Array<MomoaMemberNode>} members The members to add.
     * @param {MomoaNodeParts} parts Additional properties for the node. 
     * @returns {MomoaObjectNode} The object node.
     */
    object(members, parts = {}) {
        return {
            type: "Object",
            members,
            ...parts
        };
    },

    /**
     * Creates a member node.
     * @param {MomoaStringNode} name The name for the member.
     * @param {MomoaNode} value The value for the member.
     * @param {MomoaNodeParts} parts Additional properties for the node. 
     * @returns {MomoaMemberNode} The member node.
     */
    member(name, value, parts = {}) {
        return {
            type: "Member",
            name,
            value,
            ...parts
        };
    },

};
