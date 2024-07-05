
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
import json5 from "json5";

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

const json5Objects = [
    ...objects,
    { foo: "bar", baz: 5, bak: true },
    { a: 1, b: 2, c: 3, d: false },
    { items: [1, 2, 3], "foo bar": "baz" },
    { "a b": "c d", "e f": "g h", "i j": "k l" },
    { Infinity: true },
    { NaN: false },
    { Infinity: true, NaN: false },
    { a: NaN, b: Infinity, c: -Infinity },
    { a: NaN, b: Infinity, c: -Infinity, d: NaN, e: Infinity, f: -Infinity }
];

const json5Arrays = [
    ...arrays,
    [1, 2, 3],
    ["a", 2, true, null],
    [{ name: "foo", "bar": 5 }, false, "what"],
];

const json5Strings = [
    "'\\b\\f\\n\\r\\t\\v\\0\\x0f\\u01fF\\\n\\\r\n\\\r\\\u2028\\\u2029\\a\\'\\\"'",
    "'\u2028\u2029'"
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
                [t.null(), null],
                [t.infinity(), Infinity],
                [t.infinity("-"), -Infinity],
                [t.identifier("foo"), "foo"]
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

                it("should evaluate NaN when called", () => {
                    const result = evaluate(t.nan());
                    expect(result).to.be.NaN;
                });

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

            describe("JSON 5 Objects", () => {
                
                for (const object of json5Objects) {
                    const text = json5.stringify(object);
                    const node = parse(text, { mode: "json5" });

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

            describe("JSON5 Arrays", () => {
                    
                for (const array of json5Arrays) {
                    const text = json5.stringify(array);
                    const node = parse(text, { mode: "json5" });

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

            describe("JSON5 Strings", () => {
                
                for (const text of json5Strings) {
                    const node = parse(text, { mode: "json5" });
                    const expected = json5.parse(text);

                    it(`should evaluate ${text} when called`, () => {
                        const result = evaluate(node);
                        expect(result).to.equal(expected);
                    });

                    it(`should evaluate ${text} when in a document`, () => {
                        const result = evaluate(t.document(node));
                        expect(result).to.equal(expected);
                    });
                }

            });

        });

    });
});
