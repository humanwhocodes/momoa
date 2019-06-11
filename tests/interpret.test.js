
/**
 * @fileoverview Tests for interpreter
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

const { parse, interpret, types: t } = require("../");
const { expect } = require("chai");

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const primitiveValues = new Map([
    [t.string("Hello world"), "Hello world"],
    [t.number(5), 5],
    [t.boolean(true), true],
    [t.boolean(false), false],
    [t.null(), null]
]);

const objects = [
    { foo: "bar", baz: 5, bak: true },
    { a: 1, b: 2, c: 3, d: false },
    { items: [1, 2, 3], "foo bar": "baz" }
];

const arrays = [
    [1, 2, 3],
    ["a", 2, true, null],
    [{name:"foo", "bar": 5}, false, "what"]
];

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("interpret()", () => {

    describe("Primitive Values", () => {

        for (const [node, value] of primitiveValues) {
            it(`should interpret ${value} when called`, () => {
                const result = interpret(node);
                expect(result).to.equal(value);
            });

            it(`should interpret ${value} when in a document`, () => {
                const result = interpret(t.document(node));
                expect(result).to.equal(value);
            });
        }

    });

    describe("Objects", () => {

        for (const object of objects) {
            const text = JSON.stringify(object);
            const node = parse(text);

            it(`should interpret ${text} when called`, () => {
                const result = interpret(node);
                expect(result).to.deep.equal(object);
            });

            it(`should interpret ${text} when in a document`, () => {
                const result = interpret(t.document(node));
                expect(result).to.deep.equal(object);
            });
        }

    });

    describe("Arrays", () => {

        for (const array of arrays) {
            const text = JSON.stringify(array);
            const node = parse(text);
            

            it(`should interpret ${text} when called`, () => {
                const result = interpret(node);
                expect(result).to.deep.equal(array);
            });

            it(`should interpret ${text} when in a document`, () => {
                const result = interpret(t.document(node));
                expect(result).to.deep.equal(array);
            });
        }

    });

});