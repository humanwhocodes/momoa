
/**
 * @fileoverview Tests for traverse
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

const { iterator, traverse, types: t } = require("../api");
const { expect } = require("chai");
const { spy } = require("sinon");

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const singleNodes = new Map([
    ["string", "Hello world!"],
    ["boolean", true],
    ["number", 1]
]);

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("traverse()", () => {

    for (const [methodName, value] of singleNodes) {
        it("should traverse when there is only a " + methodName, () => {
            const root = t.document(t[methodName](value));
    
            const enter = spy();
            const exit = spy();
    
            traverse(root, { enter, exit });
    
            expect(enter.args).to.deep.equal([
                [root, undefined],
                [root.body, root]
            ]);
            expect(exit.args).to.deep.equal([
                [root.body, root],
                [root, undefined]
            ]);
        });

        it("should traverse when there is only a " + methodName + " and just an enter function", () => {
            const root = t.document(t[methodName](value));

            const enter = spy();

            traverse(root, { enter });

            expect(enter.args).to.deep.equal([
                [root, undefined],
                [root.body, root]
            ]);
        });

        it("should traverse when there is only a " + methodName + " and just an exit function", () => {
            const root = t.document(t[methodName](value));

            const exit = spy();

            traverse(root, { exit });

            expect(exit.args).to.deep.equal([
                [root.body, root],
                [root, undefined]
            ]);
        });

    }


});

describe("iterator()", () => {

    it("should iterate when there is only a string", () => {
        const root = t.document(t.string("Hello world"));
        const steps = [...iterator(root)];

        expect(steps).to.deep.equal([
            { node: root, parent: undefined, phase: "enter" },
            { node: root.body, parent: root, phase: "enter" },
            { node: root.body, parent: root, phase: "exit" },
            { node: root, parent: undefined, phase: "exit" }
        ]);
    });

    it("should iterate when there is only a number", () => {
        const root = t.document(t.number(1));
        const steps = [...iterator(root)];

        expect(steps).to.deep.equal([
            { node: root, parent: undefined, phase: "enter" },
            { node: root.body, parent: root, phase: "enter" },
            { node: root.body, parent: root, phase: "exit" },
            { node: root, parent: undefined, phase: "exit" }
        ]);
    });

    it("should iterate when there is only a boolean", () => {
        const root = t.document(t.boolean(true));
        const steps = [...iterator(root)];

        expect(steps).to.deep.equal([
            { node: root, parent: undefined, phase: "enter" },
            { node: root.body, parent: root, phase: "enter" },
            { node: root.body, parent: root, phase: "exit" },
            { node: root, parent: undefined, phase: "exit" }
        ]);
    });

    it("should iterate when there is only a null", () => {
        const root = t.document(t.null());
        const steps = [...iterator(root)];

        expect(steps).to.deep.equal([
            { node: root, parent: undefined, phase: "enter" },
            { node: root.body, parent: root, phase: "enter" },
            { node: root.body, parent: root, phase: "exit" },
            { node: root, parent: undefined, phase: "exit" }
        ]);
    });

});
