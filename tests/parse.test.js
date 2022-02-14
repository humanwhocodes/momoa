
/**
 * @fileoverview Tests for parser
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

const { parse } = require("../");
const fs = require("fs");
const path = require("path");
const { expect } = require("chai");

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("parse()", () => {

    describe("error", () => {
        it("should throw an error when an unexpected token is found", () => {
            const text = "\"hi\"123";

            expect(() => {
                parse(text);
            }).to.throw("Unexpected token Number(123) found.");
        });

        it("should throw an error when a string isn't closed", () => {
            const text = "\"hi";

            expect(() => {
                parse(text);
            }).to.throw("Unexpected end of input found.");
        });

        it("should throw an error when an embedded string isn't closed", () => {
            const text = `{
  "key": [1, 2, {"key: 1}]
}`;

            expect(() => {
                parse(text);
            }).to.throw("Unexpected end of input found.");
        });

        it("should throw an error when there is a dangling comma", () => {
            const text = `{
   "key1": 1,
}`;

            expect(() => {
                parse(text);
            }).to.throw("Unexpected token Punctuator(}) found.");
        });

        it("should throw an error when there is a dangling comma in an array", () => {
            const text = `[
   1,
]`;

            expect(() => {
                parse(text);
            }).to.throw("Unexpected token Punctuator(]) found.");
        });
    });

    describe("tokens", () => {
        it("should return a tokens array when tokens:true is passed", () => {
            const text = "\"hi\"";
            const result = parse(text, { tokens: true });
            expect(result.tokens).to.deep.equal([
                {
                    type: "String",
                    value: "\"hi\"",
                    loc: {
                        start: { line: 1, column: 1, offset: 0 },
                        end: { line: 1, column: 5, offset: 4}
                    }
                }
            ]);
        });

        it("should not return a tokens array when tokens is not passed", () => {
            const text = "\"hi\"";
            const result = parse(text);
            expect(result.tokens).to.be.undefined;
        });

        it("should not return a tokens array when tokens:false is passed", () => {
            const text = "\"hi\"";
            const result = parse(text, { tokens: false });
            expect(result.tokens).to.be.undefined;
        });
    });

    describe("fixtures", () => {
        const astsPath = "./tests/fixtures/asts";
        fs.readdirSync(astsPath).forEach(fileName => {
            
            const filePath = path.join(astsPath, fileName);
            const contents = fs.readFileSync(filePath, "utf8").replace(/\r/g, "");
            const separatorIndex = contents.indexOf("---");
            
            it(`Test in ${ fileName } should parse correctly`, () => {
                const text = contents.slice(0, separatorIndex);
                const json = contents.slice(separatorIndex + 4).trim();
                const expected = JSON.parse(json);
                const result = parse(text, { tokens: true, comments: true, ranges: true });
                expect(result).to.deep.equal(expected);
            });
        });
    });


});
