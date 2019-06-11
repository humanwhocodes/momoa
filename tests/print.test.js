
/**
 * @fileoverview Tests for printer
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

const { parse, print } = require("../");
const { expect } = require("chai");

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const data = [
    true,
    false,
    null,
    15,
    -12,
    0.1,
    "Hello world",
    "",
    { a: "b", c: 2, d: true, e: null },
    ["a", "b", "c", "d"],
    [1, 2, 3, 4],
    { items: [1,2,3], name: "foo", flag: false },
    [{name:"foo", "a b": "c", found: true }, 2, false]
];

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("print()", () => {

    describe("data", () => {

        for (const value of data) {

            it(`should print ${value} the same as JSON.stringify() when called with no indent`, () => {
                const nativeResult = JSON.stringify(value);
                const result = print(parse(nativeResult));
                expect(result).to.equal(nativeResult);
            });
            
            it(`should print ${value} the same as JSON.stringify() when called with indent`, () => {
                const nativeResult = JSON.stringify(value, null, 4);
                const result = print(parse(nativeResult), { indent: 4 });
                expect(result).to.equal(nativeResult);
            });
        }

    });

});