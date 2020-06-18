/**
 * @fileoverview Momoa JSON AST types
 * @author Nicholas C. Zakas
 */

export const types = {
    document(body, parts = {}) {
        return {
            type: "Document",
            body,
            ...parts
        };
    },
    string(value, parts = {}) {
        return {
            type: "String",
            value,
            ...parts
        };
    },
    number(value, parts = {}) {
        return {
            type: "Number",
            value,
            ...parts
        };
    },
    boolean(value, parts = {}) {
        return {
            type: "Boolean",
            value,
            ...parts
        };
    },
    null(parts = {}) {
        return {
            type: "Null",
            value: "null",
            ...parts
        };
    },
    array(elements, parts = {}) {
        return {
            type: "Array",
            elements,
            ...parts
        };
    },
    object(members, parts = {}) {
        return {
            type: "Object",
            members,
            ...parts
        };
    },
    member(name, value, parts = {}) {
        return {
            type: "Member",
            name,
            value,
            ...parts
        };
    },

};
