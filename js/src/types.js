/**
 * @fileoverview  JSON AST types
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Typedefs
//-----------------------------------------------------------------------------

/** @typedef {import("./typedefs.js").Location} Location */
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
/** @typedef {import("./typedefs.js").ValueNode} ValueNode */
/** @typedef {import("./typedefs.js").IdentifierNode} IdentifierNode */
/** @typedef {import("./typedefs.js").NaNNode} NaNNode */
/** @typedef {import("./typedefs.js").InfinityNode} InfinityNode */
/** @typedef {import("./typedefs.js").Sign} Sign */

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

export const types = {

    /**
     * Creates a document node.
     * @param {ValueNode} body The body of the document.
     * @param {NodeParts} parts Additional properties for the node. 
     * @returns {DocumentNode} The document node.
     */
    document(body, parts = {}) {
        return {
            type: "Document",
            body,
            loc: parts.loc,
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
            loc: parts.loc,
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
            loc: parts.loc,
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
            loc: parts.loc,
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
            loc: parts.loc,
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
            loc: parts.loc,
            ...parts
        };
    },

    /**
     * Creates an element node.
     * @param {ValueNode} value The value for the element.
     * @param {NodeParts} parts Additional properties for the node. 
     * @returns {ElementNode} The element node.
     */
    element(value, parts = {}) {
        return {
            type: "Element",
            value,
            loc: parts.loc,
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
            loc: parts.loc,
            ...parts
        };
    },

    /**
     * Creates a member node.
     * @param {StringNode|IdentifierNode} name The name for the member.
     * @param {ValueNode} value The value for the member.
     * @param {NodeParts} parts Additional properties for the node. 
     * @returns {MemberNode} The member node.
     */
    member(name, value, parts = {}) {
        return {
            type: "Member",
            name,
            value,
            loc: parts.loc,
            ...parts
        };
    },

    /**
     * Creates an identifier node.
     * @param {string} name The name for the identifier.
     * @param {NodeParts} parts Additional properties for the node.
     * @returns {IdentifierNode} The identifier node.
     */
    identifier(name, parts = {}) {
        return {
            type: "Identifier",
            name,
            loc: parts.loc,
            ...parts
        };
    },

    /**
     * Creates a NaN node.
     * @param {Sign} sign The sign for the Infinity.
     * @param {NodeParts} parts Additional properties for the node.
     * @returns {NaNNode} The NaN node.
     */ 
    nan(sign = "", parts = {}) {
        return {
            type: "NaN",
            sign,
            loc: parts.loc,
            ...parts
        };
    },

    /**
     * Creates an Infinity node.
     * @param {Sign} sign The sign for the Infinity.
     * @param {NodeParts} parts Additional properties for the node.
     * @returns {InfinityNode} The Infinity node.
     */
    infinity(sign = "", parts = {}) {
        return {
            type: "Infinity",
            sign,
            loc: parts.loc,
            ...parts
        };
    },

};
