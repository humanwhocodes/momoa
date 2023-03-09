
/**
 * @fileoverview Tests for evaluateer
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import * as momoa_esm from "../dist/momoa.js";
import momoa_cjs from "../dist/momoa.cjs";
import { expect } from "chai";

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const objects = [
    { foo: "bar", baz: 5, bak: true },
    { a: 1, b: 2, c: 3, d: false },
    { items: [1, 2, 3], "foo bar": "baz" }
];

const arrays = [
    [1, 2, 3],
    ["a", 2, true, null],
    [{ name: "foo", "bar": 5 }, false, "what"]
];

const pkgs = {
    cjs: momoa_cjs,
    esm: momoa_esm,
};

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("evaluate()", () => {

    Object.entries(pkgs).forEach(([name, { parse, evaluate, types: t }]) => {

        describe(name, () => {

            const primitiveValues = new Map([
                [t.string("Hello world"), "Hello world"],
                [t.number(5), 5],
                [t.boolean(true), true],
                [t.boolean(false), false],
                [t.null(), null]
            ]);

            describe("Primitive Values", () => {

                for (const [node, value] of primitiveValues) {
                    it(`should evaluate ${value} when called`, () => {
                        const result = evaluate(node);
                        expect(result).to.equal(value);
                    });

                    it(`should evaluate ${value} when in a document`, () => {
                        const result = evaluate(t.document(node));
                        expect(result).to.equal(value);
                    });
                }

            });

            describe("Objects", () => {

                for (const object of objects) {
                    const text = JSON.stringify(object);
                    const node = parse(text);

                    it(`should evaluate ${text} when called`, () => {
                        const result = evaluate(node);
                        expect(result).to.deep.equal(object);
                    });

                    it(`should evaluate ${text} when in a document`, () => {
                        const result = evaluate(t.document(node));
                        expect(result).to.deep.equal(object);
                    });
                }

            });

            describe("Arrays", () => {

                for (const array of arrays) {
                    const text = JSON.stringify(array);
                    const node = parse(text);


                    it(`should evaluate ${text} when called`, () => {
                        const result = evaluate(node);
                        expect(result).to.deep.equal(array);
                    });

                    it(`should evaluate ${text} when in a document`, () => {
                        const result = evaluate(t.document(node));
                        expect(result).to.deep.equal(array);
                    });
                }

            });

        });

    });
});
