
/**
 * @fileoverview Tests for traverse
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

const { traverse, types: t } = require("../");
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
    }

});