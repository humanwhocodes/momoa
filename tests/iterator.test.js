
/**
 * @fileoverview Tests for iterator
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

const { iterator, types: t } = require("../");
const fs = require("fs");
const path = require("path");
const { expect } = require("chai");

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("iterator()", () => {

    it("should iterate when there is only a string", () => {
        const root = t.document(t.string("Hello world"));
        const steps = [...iterator(root)];

        expect(steps).to.deep.equal([
            { node: root, parent: undefined, parentKey: undefined, inArray: false, arrayIndex: -1, phase: "enter" },
            { node: root.body, parent: root, parentKey: "body", inArray: false, arrayIndex: -1, phase: "enter" },
            { node: root.body, parent: root, parentKey: "body", inArray: false, arrayIndex: -1, phase: "exit" },
            { node: root, parent: undefined, parentKey: undefined, inArray: false, arrayIndex: -1, phase: "exit" }
        ]);
    });

    it("should iterate when there is only a number", () => {
        const root = t.document(t.number(1));
        const steps = [...iterator(root)];

        expect(steps).to.deep.equal([
            { node: root, parent: undefined, parentKey: undefined, inArray: false, arrayIndex: -1, phase: "enter" },
            { node: root.body, parent: root, parentKey: "body", inArray: false, arrayIndex: -1, phase: "enter" },
            { node: root.body, parent: root, parentKey: "body", inArray: false, arrayIndex: -1, phase: "exit" },
            { node: root, parent: undefined, parentKey: undefined, inArray: false, arrayIndex: -1, phase: "exit" }
        ]);
    });

    it("should iterate when there is only a boolean", () => {
        const root = t.document(t.boolean(true));
        const steps = [...iterator(root)];

        expect(steps).to.deep.equal([
            { node: root, parent: undefined, parentKey: undefined, inArray: false, arrayIndex: -1, phase: "enter" },
            { node: root.body, parent: root, parentKey: "body", inArray: false, arrayIndex: -1, phase: "enter" },
            { node: root.body, parent: root, parentKey: "body", inArray: false, arrayIndex: -1, phase: "exit" },
            { node: root, parent: undefined, parentKey: undefined, inArray: false, arrayIndex: -1, phase: "exit" }
        ]);
    });

    it("should iterate when there is only a null", () => {
        const root = t.document(t.null());
        const steps = [...iterator(root)];

        expect(steps).to.deep.equal([
            { node: root, parent: undefined, parentKey: undefined, inArray: false, arrayIndex: -1, phase: "enter" },
            { node: root.body, parent: root, parentKey: "body", inArray: false, arrayIndex: -1, phase: "enter" },
            { node: root.body, parent: root, parentKey: "body", inArray: false, arrayIndex: -1, phase: "exit" },
            { node: root, parent: undefined, parentKey: undefined, inArray: false, arrayIndex: -1, phase: "exit" }
        ]);
    });



});