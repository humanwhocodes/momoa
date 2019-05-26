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
    array(items, parts = {}) {
        return {
            type: "Array",
            items,
            ...parts
        };
    },
    object(body, parts = {}) {
        return {
            type: "Object",
            body,
            ...parts
        };
    },
    property(name, value, parts = {}) {
        return {
            type: "Property",
            name,
            value,
            ...parts
        };
    },

};