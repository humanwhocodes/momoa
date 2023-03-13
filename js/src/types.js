/**
 * @fileoverview  JSON AST types
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Typedefs
//-----------------------------------------------------------------------------

/** @typedef {import("./momoa").Location} Location */
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
/** @typedef {import("./momoa").AnyValueNode} AnyValueNode */

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

export const types = {

    /**
     * Creates a document node.
     * @param {AnyValueNode} body The body of the document.
     * @param {NodeParts} parts Additional properties for the node. 
     * @returns {DocumentNode} The document node.
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
     * @param {NodeParts} parts Additional properties for the node. 
     * @returns {StringNode} The string node.
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
     * @param {NodeParts} parts Additional properties for the node. 
     * @returns {NumberNode} The number node.
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
     * @param {NodeParts} parts Additional properties for the node. 
     * @returns {BooleanNode} The boolean node.
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
     * @param {NodeParts} parts Additional properties for the node. 
     * @returns {NullNode} The null node.
     */
    null(parts = {}) {
        return {
            type: "Null",
            ...parts
        };
    },

    /**
     * Creates an array node.
     * @param {Array<ElementNode>} elements The elements to add.
     * @param {NodeParts} parts Additional properties for the node. 
     * @returns {ArrayNode} The array node.
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
     * @param {AnyValueNode} value The value for the element.
     * @param {NodeParts} parts Additional properties for the node. 
     * @returns {ElementNode} The element node.
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
     * @param {Array<MemberNode>} members The members to add.
     * @param {NodeParts} parts Additional properties for the node. 
     * @returns {ObjectNode} The object node.
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
     * @param {StringNode} name The name for the member.
     * @param {AnyValueNode} value The value for the member.
     * @param {NodeParts} parts Additional properties for the node. 
     * @returns {MemberNode} The member node.
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
