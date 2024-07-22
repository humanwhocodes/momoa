
/**
 * @fileoverview Tests for printer
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import * as momoa_esm from "../dist/momoa.js";
import momoa_cjs from "../dist/momoa.cjs";
import { expect } from "chai";
import json5 from "json5";

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const pkgs = {
    cjs: momoa_cjs,
    esm: momoa_esm,
};

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
    { items: [1, 2, 3], name: "foo", flag: false },
    [{ name: "foo", "a b": "c", found: true }, 2, false]
];

const json5Data = [
    ...data,
    NaN,
    Infinity,
    -Infinity,
    { a: NaN, b: Infinity, c: -Infinity },
    [NaN, Infinity, -Infinity],
    [{ a: NaN, b: Infinity, c: -Infinity }, 2, false],
    "NaN",
    "Foo\\\nbar",
    "Foo\\bar",
    "foo\\o",
    "foo\\\u2028bar",
    "foo\\\u2029bar",
];

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/**
 * The JSON5 utility frustratingly adds dangling commas on every array and object
 * when using an indent. This function removes those dangling commas so we can
 * compare output.
 * @param {string} str The string to process. 
 * @returns {string} The string with dangling commas removed
 */
function removeDanglingCommas(str) {
    return str.replace(/,(\s*)]/g, "$1]").replace(/,(\s*)}/g, "$1}");
}

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------


describe("print()", () => {

    Object.entries(pkgs).forEach(([name, { parse, print }]) => {

        describe(name, () => {

            describe("JSON data", () => {

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

            describe("JSON5 data", () => {

                for (const value of json5Data) {

                    it(`should print ${value} the same as json5.stringify() when called with no indent`, () => {
                        const nativeResult = json5.stringify(value, { quote: "\"" });
                        const result = print(parse(nativeResult, { mode: "json5" }));
                        const expected = json5.stringify(json5.parse(nativeResult), { quote: "\"" });

                        expect(result).to.equal(expected);
                    });

                    it(`should print ${value} the same as json5.stringify() when called with indent`, () => {
                        const nativeResult = json5.stringify(value, { quote: "\"" });
                        const result = print(parse(nativeResult, { mode: "json5" }), { indent: 4 });
                        const expected = removeDanglingCommas(json5.stringify(json5.parse(nativeResult), { quote: "\"", space: 4 }));

                        expect(result).to.equal(expected);
                    });
                }

            });

        });
    });
});
